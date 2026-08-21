package jp.co.seizo.mes.inspection;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InspectionController.class)
@Import({ InspectionService.class, InspectionJudgmentService.class })
class InspectionControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockBean
	private InspectionRepository repository;

	@Test
	@DisplayName("非数値の測定値は登録されず、現行と同じメッセージを 400 で返す")
	void nonNumericSunpouIsRejected() throws Exception {
		mockMvc.perform(post("/api/inspections")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"shiji_no":"SJ-0001","lot_no":"LOT-0101-01","kensa_sha":"高橋 花子",
						 "sunpou":"abc","kijun_min":"219.900","kijun_max":"220.100","furyo_naiyo":""}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.ok").value(false))
				.andExpect(jsonPath("$.message").value("測定値は数値で入力してください。"));

		verify(repository, never()).insert(anyString(), anyString(), anyString(), any(), any(), any(), anyString(),
				anyString());
	}

	@Test
	@DisplayName("空の測定値も登録されない")
	void blankSunpouIsRejected() throws Exception {
		mockMvc.perform(post("/api/inspections")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"shiji_no":"SJ-0001","lot_no":"LOT-0101-01","kensa_sha":"高橋 花子",
						 "sunpou":"","kijun_min":"219.900","kijun_max":"220.100","furyo_naiyo":""}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("測定値は数値で入力してください。"));

		verify(repository, never()).insert(anyString(), anyString(), anyString(), any(), any(), any(), anyString(),
				anyString());
	}

	@Test
	@DisplayName("上限ちょうどの登録は判定 再検査 で INSERT され、メッセージに判定が含まれる")
	void registersWithJudgment() throws Exception {
		when(repository.insert(anyString(), anyString(), anyString(), any(), any(), any(), anyString(), anyString()))
				.thenReturn(42);

		mockMvc.perform(post("/api/inspections")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"shiji_no":"SJ-0001","lot_no":"LOT-0101-01","kensa_sha":"高橋 花子",
						 "sunpou":"220.100","kijun_min":"219.900","kijun_max":"220.100","furyo_naiyo":"寸法外れ"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.ok").value(true))
				.andExpect(jsonPath("$.hantei").value("再検査"))
				.andExpect(jsonPath("$.kensa_id").value(42))
				.andExpect(jsonPath("$.message").value("検査結果を登録しました。判定は 再検査 です。"));

		verify(repository).insert("SJ-0001", "LOT-0101-01", "高橋 花子",
				new BigDecimal("220.100"), new BigDecimal("219.900"), new BigDecimal("220.100"),
				"再検査", "寸法外れ");
	}
}
