package jp.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import jp.seizo.mes.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class InspectionApiIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JdbcTemplate jdbc;

	@Autowired
	private ObjectMapper objectMapper;

	@ParameterizedTest(name = "sunpou={0} → t_kensa.hantei={1}")
	@CsvSource({ "220.095, 再検査, ''", "219.899, NG, 寸法下限外れ", "220.090, OK, ''" })
	void postStoresJudgedHanteiInTKensa(String sunpou, String expectedHantei, String furyoNaiyo) throws Exception {
		String body = objectMapper.writeValueAsString(Map.of("shiji_no", "SJ-2608-0014", "lot_no", "LOT-IT-01",
				"kensa_sha", "高橋 花子", "sunpou", sunpou, "kijun_min", "219.900", "kijun_max", "220.100",
				"furyo_naiyo", furyoNaiyo));

		String response = mockMvc.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.hantei").value(expectedHantei))
			.andExpect(jsonPath("$.message").value("検査結果を登録しました。判定は " + expectedHantei + " です。"))
			.andReturn()
			.getResponse()
			.getContentAsString();
		long kensaId = objectMapper.readTree(response).get("kensa_id").asLong();

		Map<String, Object> row = jdbc.queryForMap(
				"select k.*, k.kensa_ymd = curdate() as is_today from t_kensa k where kensa_id = ?", kensaId);
		assertThat(row.get("shiji_no")).isEqualTo("SJ-2608-0014");
		assertThat(row.get("lot_no")).isEqualTo("LOT-IT-01");
		assertThat(row.get("kensa_sha")).isEqualTo("高橋 花子");
		assertThat(row.get("sunpou")).isEqualTo(new BigDecimal(sunpou));
		assertThat(row.get("kijun_min")).isEqualTo(new BigDecimal("219.900"));
		assertThat(row.get("kijun_max")).isEqualTo(new BigDecimal("220.100"));
		assertThat(row.get("hantei")).isEqualTo(expectedHantei);
		assertThat(row.get("furyo_naiyo")).isEqualTo(furyoNaiyo);
		assertThat(((Number) row.get("is_today")).intValue()).isEqualTo(1);
	}

	@Test
	void postAcceptsJsonNumbers() throws Exception {
		mockMvc
			.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"shiji_no":"SJ-2608-0014","lot_no":"LOT-IT-02","kensa_sha":"高橋 花子",
						 "sunpou":220.100,"kijun_min":219.900,"kijun_max":220.100,"furyo_naiyo":""}
						"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.hantei").value("再検査"));
	}

	@ParameterizedTest(name = "sunpou=\"{0}\" → 400, 登録なし")
	@CsvSource({ "abc", "''", "' '" })
	void postRejectsNonNumericSunpouWithoutInsert(String sunpou) throws Exception {
		int before = countKensa();
		String body = objectMapper.writeValueAsString(Map.of("shiji_no", "SJ-2608-0014", "lot_no", "LOT-IT-03",
				"kensa_sha", "高橋 花子", "sunpou", sunpou, "kijun_min", "219.900", "kijun_max", "220.100",
				"furyo_naiyo", ""));

		mockMvc.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.field").value("sunpou"))
			.andExpect(jsonPath("$.message").value("測定値は数値で入力してください。"));

		assertThat(countKensa()).isEqualTo(before);
	}

	@Test
	void postRejectsMissingSunpouWithoutInsert() throws Exception {
		int before = countKensa();
		mockMvc
			.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"shiji_no":"SJ-2608-0014","kijun_min":"219.900","kijun_max":"220.100"}
						"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("測定値は数値で入力してください。"));
		assertThat(countKensa()).isEqualTo(before);
	}

	@Test
	void postRejectsMissingShijiNo() throws Exception {
		mockMvc
			.perform(post("/api/inspections").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"sunpou":"220.000","kijun_min":"219.900","kijun_max":"220.100"}
						"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.field").value("shiji_no"));
	}

	@ParameterizedTest(name = "shiji_no=\"{0}\", hantei=\"{1}\"")
	@CsvSource({ "'', ''", "'', NG", "'', 再検査", "'', OK", "SJ-2608-0009, ''", "SJ-2608-0009, NG",
			"SJ-2608-9999, ''", "'x'' or ''1''=''1', ''" })
	void listMatchesLegacyQuery(String shijiNo, String hantei) throws Exception {
		String legacyWhere = "";
		if (!shijiNo.isEmpty()) {
			legacyWhere += " and k.shiji_no = ?";
		}
		if (!hantei.isEmpty()) {
			legacyWhere += " and k.hantei = ?";
		}
		Object[] args = java.util.stream.Stream.of(shijiNo, hantei).filter(s -> !s.isEmpty()).toArray();
		List<Map<String, Object>> legacy = jdbc.queryForList("""
				select k.*, h.hinmoku_nm, s.line_cd
				from t_kensa k, t_seizou_shiji s, m_hinmoku h
				where k.shiji_no = s.shiji_no and s.hinmoku_cd = h.hinmoku_cd
				""" + legacyWhere + " order by k.kensa_ymd desc, k.kensa_id desc", args);

		String response = mockMvc.perform(get("/api/inspections").param("shiji_no", shijiNo).param("hantei", hantei))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();
		JsonNode actual = objectMapper.readTree(response);

		assertThat(actual.size()).isEqualTo(legacy.size());
		for (int i = 0; i < legacy.size(); i++) {
			Map<String, Object> expected = legacy.get(i);
			JsonNode row = actual.get(i);
			assertThat(row.get("kensa_id").asLong()).isEqualTo(((Number) expected.get("kensa_id")).longValue());
			for (String column : List.of("shiji_no", "hinmoku_nm", "line_cd", "lot_no", "kensa_sha", "hantei",
					"furyo_naiyo")) {
				assertThat(row.get(column).asString()).as(column).isEqualTo(expected.get(column));
			}
			for (String column : List.of("sunpou", "kijun_min", "kijun_max")) {
				assertThat(row.get(column).decimalValue()).as(column).isEqualByComparingTo((BigDecimal) expected.get(column));
			}
			assertThat(LocalDate.parse(row.get("kensa_ymd").asString()))
				.isEqualTo(((java.sql.Date) expected.get("kensa_ymd")).toLocalDate());
		}
	}

	@Test
	void listHasAllColumns() throws Exception {
		mockMvc.perform(get("/api/inspections"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].kensa_id").exists())
			.andExpect(jsonPath("$[0].shiji_no").value(startsWith("SJ-")))
			.andExpect(jsonPath("$[0].hinmoku_nm").exists())
			.andExpect(jsonPath("$[0].line_cd").exists())
			.andExpect(jsonPath("$[0].lot_no").exists())
			.andExpect(jsonPath("$[0].kensa_ymd").exists())
			.andExpect(jsonPath("$[0].kensa_sha").exists())
			.andExpect(jsonPath("$[0].sunpou").exists())
			.andExpect(jsonPath("$[0].kijun_min").exists())
			.andExpect(jsonPath("$[0].kijun_max").exists())
			.andExpect(jsonPath("$[0].hantei").exists())
			.andExpect(jsonPath("$[0].furyo_naiyo").exists());
	}

	@Test
	void defectSummaryMatchesLegacyQuery() throws Exception {
		List<Map<String, Object>> legacy = jdbc.queryForList("""
				select furyo_naiyo, count(*) as ken from t_kensa
				where hantei <> 'OK' and furyo_naiyo <> ''
				group by furyo_naiyo order by ken desc
				""");
		JsonNode actual = objectMapper.readTree(mockMvc.perform(get("/api/inspections/defect-summary"))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString());

		assertThat(legacy).isNotEmpty();
		assertThat(actual.size()).isEqualTo(legacy.size());
		for (int i = 0; i < legacy.size(); i++) {
			assertThat(actual.get(i).get("furyo_naiyo").asString()).isEqualTo(legacy.get(i).get("furyo_naiyo"));
			assertThat(actual.get(i).get("ken").asLong()).isEqualTo(((Number) legacy.get(i).get("ken")).longValue());
		}
	}

	@Test
	void productionOrdersMatchLegacyQuery() throws Exception {
		List<Map<String, Object>> legacy = jdbc.queryForList("""
				select s.shiji_no, h.hinmoku_nm from t_seizou_shiji s, m_hinmoku h
				where s.hinmoku_cd = h.hinmoku_cd order by s.shiji_no desc
				""");
		JsonNode actual = objectMapper.readTree(mockMvc.perform(get("/api/production-orders"))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString());

		assertThat(actual.size()).isEqualTo(legacy.size()).isEqualTo(14);
		for (int i = 0; i < legacy.size(); i++) {
			assertThat(actual.get(i).get("shiji_no").asString()).isEqualTo(legacy.get(i).get("shiji_no"));
			assertThat(actual.get(i).get("hinmoku_nm").asString()).isEqualTo(legacy.get(i).get("hinmoku_nm"));
		}
		assertThat(actual.get(0).get("shiji_no").asString()).isEqualTo("SJ-2608-0014");
	}

	private int countKensa() {
		return jdbc.queryForObject("select count(*) from t_kensa", Integer.class);
	}

}
