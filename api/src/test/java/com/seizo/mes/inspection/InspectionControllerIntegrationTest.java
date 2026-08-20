package com.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

/** POST での登録・判定と GET での絞込を、実際に t_kensa を持つ DB (H2/MySQL互換) で検証する。 */
@SpringBootTest
@AutoConfigureMockMvc
class InspectionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanKensa() {
        jdbcTemplate.update("delete from t_kensa");
    }

    @Test
    void registersReInspectionAndPersistsRow() throws Exception {
        mockMvc.perform(post("/api/inspections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"shiji_no":"SJ-0001","lot_no":"LOT-0101-01","kensa_sha":"\u9ad8\u6a4b \u82b1\u5b50",
                                 "sunpou":"220.091","kijun_min":"219.900","kijun_max":"220.100","furyo_naiyo":"\u5bf8\u6cd5\u4e0d\u826f"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hantei").value("\u518d\u691c\u67fb"))
                .andExpect(jsonPath("$.kensa.hinmoku_nm").value("\u30d5\u30ec\u30fc\u30e0A"))
                .andExpect(jsonPath("$.kensa.line_cd").value("L1"));

        List<Kensa> rows = jdbcTemplate.query(
                "select lot_no, kensa_ymd, sunpou, hantei from t_kensa",
                (rs, i) -> new Kensa(
                        rs.getString(1),
                        rs.getDate(2).toLocalDate(),
                        rs.getBigDecimal(3),
                        rs.getString(4)));
        assertThat(rows).hasSize(1);
        Kensa saved = rows.get(0);
        assertThat(saved.hantei()).isEqualTo("\u518d\u691c\u67fb");
        assertThat(saved.lotNo()).isEqualTo("LOT-0101-01");
        assertThat(saved.kensaYmd()).isEqualTo(LocalDate.now());
        assertThat(saved.sunpou()).isEqualByComparingTo("220.091");
    }

    @Test
    void registersOkAtUpperThresholdBoundary() throws Exception {
        mockMvc.perform(post("/api/inspections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"shiji_no":"SJ-0001","lot_no":"L","kensa_sha":"t",
                                 "sunpou":"220.090","kijun_min":"219.900","kijun_max":"220.100","furyo_naiyo":""}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hantei").value("OK"));
    }

    @Test
    void rejectsNonNumericSunpouWithoutInsert() throws Exception {
        mockMvc.perform(post("/api/inspections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"shiji_no":"SJ-0001","lot_no":"L","kensa_sha":"t",
                                 "sunpou":"abc","kijun_min":"219.900","kijun_max":"220.100","furyo_naiyo":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("\u6e2c\u5b9a\u5024\u306f\u6570\u5024\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002"));

        assertThat(jdbcTemplate.queryForObject("select count(*) from t_kensa", Integer.class)).isZero();
    }

    @Test
    void filtersHistoryByShijiNoAndHantei() throws Exception {
        insert("SJ-0001", "219.899", Hantei.NG, "\u5bf8\u6cd5\u4e0d\u826f");
        insert("SJ-0001", "220.000", Hantei.OK, "");
        insert("SJ-0002", "220.100", Hantei.SAIKENSA, "\u4e0a\u9650\u30ae\u30ea\u30ae\u30ea");

        mockMvc.perform(get("/api/inspections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));

        mockMvc.perform(get("/api/inspections").param("hantei", "NG"))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].hantei").value("NG"));

        mockMvc.perform(get("/api/inspections").param("shiji_no", "SJ-0002"))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].shiji_no").value("SJ-0002"))
                .andExpect(jsonPath("$[0].hantei").value("\u518d\u691c\u67fb"));

        mockMvc.perform(get("/api/inspections")
                        .param("shiji_no", "SJ-0001")
                        .param("hantei", "\u518d\u691c\u67fb"))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void returnsDefectSummaryOrderedByCount() throws Exception {
        insert("SJ-0001", "219.899", Hantei.NG, "\u5bf8\u6cd5\u4e0d\u826f");
        insert("SJ-0001", "219.898", Hantei.NG, "\u5bf8\u6cd5\u4e0d\u826f");
        insert("SJ-0002", "220.100", Hantei.SAIKENSA, "\u30d0\u30ea");
        insert("SJ-0002", "220.000", Hantei.OK, "\u96c6\u8a08\u5bfe\u8c61\u5916");

        mockMvc.perform(get("/api/inspections/defect-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].furyo_naiyo").value("\u5bf8\u6cd5\u4e0d\u826f"))
                .andExpect(jsonPath("$[0].ken").value(2))
                .andExpect(jsonPath("$[1].ken").value(1));
    }

    @Test
    void returnsOrdersForInspectionDescending() throws Exception {
        mockMvc.perform(get("/api/orders/for-inspection"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].shiji_no").value("SJ-0002"))
                .andExpect(jsonPath("$[1].shiji_no").value("SJ-0001"));
    }

    private void insert(String shijiNo, String sunpou, Hantei hantei, String furyoNaiyo) {
        jdbcTemplate.update("""
                insert into t_kensa
                    (shiji_no, lot_no, kensa_ymd, kensa_sha, sunpou, kijun_min, kijun_max, hantei, furyo_naiyo)
                values (?, 'LOT', current_date, 't', ?, 219.900, 220.100, ?, ?)
                """, shijiNo, new java.math.BigDecimal(sunpou), hantei.value(), furyoNaiyo);
    }

    /** 登録行の検証用。 */
    private record Kensa(
            String lotNo, LocalDate kensaYmd, java.math.BigDecimal sunpou, String hantei) {}
}
