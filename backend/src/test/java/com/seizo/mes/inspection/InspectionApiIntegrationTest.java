package com.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

/** H2 (MySQL モード) 上で REST API を通しで検証する。 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(InspectionApiIntegrationTest.FixedClock.class)
class InspectionApiIntegrationTest {

    @TestConfiguration
    static class FixedClock {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2025-03-15T03:00:00Z"), ZoneId.of("Asia/Tokyo"));
        }
    }

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    private static String body(String sunpou, String furyoNaiyo) {
        return """
                {"shiji_no":"S-0001","lot_no":"LOT-0315-01","kensa_sha":"高橋 花子",
                 "sunpou":%s,"kijun_min":"219.900","kijun_max":"220.100","furyo_naiyo":"%s"}
                """.formatted(sunpou, furyoNaiyo);
    }

    @Test
    void post_registersWithJudgment_andAppearsInListAndSummary() throws Exception {
        int before = jdbc.queryForObject("select count(*) from t_kensa", Integer.class);

        mvc.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON).content(body("\"220.095\"", "上限ぎりぎり")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hantei", is("再検査")))
                .andExpect(jsonPath("$.kensa_ymd", is("2025-03-15")))
                .andExpect(jsonPath("$.hinmoku_nm", is("ポンプケーシング A")))
                .andExpect(jsonPath("$.line_cd", is("L1")))
                .andExpect(jsonPath("$.sunpou", is(220.095)));

        mvc.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON).content(body("220.101", "寸法過大")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hantei", is("NG")));

        mvc.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON).content(body("220.090", "")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hantei", is("OK")));

        int after = jdbc.queryForObject("select count(*) from t_kensa", Integer.class);
        assertThat(after).isEqualTo(before + 3);

        // 一覧: 登録日 desc, kensa_id desc なので当日登録分が先頭に来る
        mvc.perform(get("/api/inspections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(after)))
                .andExpect(jsonPath("$[0].hantei", is("OK")))
                .andExpect(jsonPath("$[1].hantei", is("NG")))
                .andExpect(jsonPath("$[2].hantei", is("再検査")));

        // 絞込: 再検査のみ (seed 1件 + 今回 1件)
        mvc.perform(get("/api/inspections").param("hantei", "再検査"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].hantei", everyItem(is("再検査"))));

        // 絞込: shiji_no + hantei
        mvc.perform(get("/api/inspections").param("shiji_no", "S-0001").param("hantei", "NG"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // 集計: 寸法過大 = seed 2 + 今回 1 = 3件 (furyo_naiyo='' の NG は除外)
        mvc.perform(get("/api/inspections/defect-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].furyo_naiyo", is("寸法過大")))
                .andExpect(jsonPath("$[0].ken", is(3)))
                .andExpect(jsonPath("$[1].furyo_naiyo", is("上限ぎりぎり")))
                .andExpect(jsonPath("$[1].ken", is(2)));
    }

    @Test
    void post_rejectsNonNumericSunpou_withoutInserting() throws Exception {
        int before = jdbc.queryForObject("select count(*) from t_kensa", Integer.class);

        mvc.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON).content(body("\"abc\"", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.sunpou", is("測定値は数値で入力してください。")));

        mvc.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON).content(body("\"\"", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.sunpou", is("測定値は数値で入力してください。")));

        mvc.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON).content(body("null", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.sunpou", is("測定値は数値で入力してください。")));

        int after = jdbc.queryForObject("select count(*) from t_kensa", Integer.class);
        assertThat(after).isEqualTo(before);
    }

    @Test
    void get_rejectsUnknownHantei() throws Exception {
        mvc.perform(get("/api/inspections").param("hantei", "保留"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void orders_returnsShijiNoDescWithHinmokuNm() throws Exception {
        mvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].shiji_no", is("S-0002")))
                .andExpect(jsonPath("$[0].hinmoku_nm", is("インペラ B")))
                .andExpect(jsonPath("$[1].shiji_no", is("S-0001")));
    }
}
