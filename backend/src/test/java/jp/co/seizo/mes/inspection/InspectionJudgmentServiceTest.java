package jp.co.seizo.mes.inspection;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 判定ロジックの境界値テスト。
 * 現行 app/inspection.cfm の挙動 (評価順序、閾値 0.010 の厳密不等号) を固定するためのもの。
 */
class InspectionJudgmentServiceTest {

	private static final BigDecimal MIN = new BigDecimal("219.900");
	private static final BigDecimal MAX = new BigDecimal("220.100");

	private final InspectionJudgmentService service = new InspectionJudgmentService();

	private String judge(String sunpou) {
		return service.judge(new BigDecimal(sunpou), MIN, MAX);
	}

	@Test
	@DisplayName("範囲内かつ上限まで余裕あり → OK")
	void withinRange() {
		assertThat(judge("220.000")).isEqualTo("OK");
	}

	@Test
	@DisplayName("下限ちょうど → OK (厳密不等号のため範囲内)")
	void exactlyMin() {
		assertThat(judge("219.900")).isEqualTo("OK");
	}

	@Test
	@DisplayName("上限ちょうど → 再検査 (差 0.000 < 0.010)")
	void exactlyMax() {
		assertThat(judge("220.100")).isEqualTo("再検査");
	}

	@Test
	@DisplayName("kijun_max - sunpou == 0.010 ちょうど → OK (`<` なので該当しない)")
	void differenceExactlyThreshold() {
		assertThat(judge("220.090")).isEqualTo("OK");
	}

	@Test
	@DisplayName("kijun_max - sunpou == 0.009 → 再検査")
	void differenceBelowThreshold() {
		assertThat(judge("220.091")).isEqualTo("再検査");
	}

	@Test
	@DisplayName("下限未満 → NG")
	void belowMin() {
		assertThat(judge("219.899")).isEqualTo("NG");
	}

	@Test
	@DisplayName("上限超過 → NG")
	void aboveMax() {
		assertThat(judge("220.101")).isEqualTo("NG");
	}

	@Test
	@DisplayName("判定順序: NG のケースでは再検査ルールが適用されない")
	void ngTakesPrecedenceOverRecheck() {
		// 上限超過は差が負 (< 0.010) だが、先に NG が確定するため再検査にならない
		assertThat(judge("220.500")).isEqualTo("NG");
		assertThat(judge("220.101")).isEqualTo("NG");
	}

	@Test
	@DisplayName("DECIMAL(8,3) 丸め境界: 4桁入力は HALF_UP で3桁に丸めてから判定される")
	void roundingBoundary() {
		// 220.0905 -> 220.091 (HALF_UP) -> 差 0.009 -> 再検査
		assertThat(judge("220.0905")).isEqualTo("再検査");
		// 220.0904 -> 220.090 -> 差 0.010 -> OK
		assertThat(judge("220.0904")).isEqualTo("OK");
		// 219.8995 -> 219.900 (下限ちょうど) -> OK
		assertThat(judge("219.8995")).isEqualTo("OK");
		// 219.8994 -> 219.899 -> 下限未満 -> NG
		assertThat(judge("219.8994")).isEqualTo("NG");
		// 220.1004 -> 220.100 -> 上限ちょうど -> 再検査
		assertThat(judge("220.1004")).isEqualTo("再検査");
		// 220.1005 -> 220.101 -> 上限超過 -> NG
		assertThat(judge("220.1005")).isEqualTo("NG");
	}

	@Test
	@DisplayName("scale が異なる入力でも比較結果は変わらない (220.1 == 220.100)")
	void scaleInsensitive() {
		assertThat(service.judge(new BigDecimal("220.1"), MIN, MAX)).isEqualTo("再検査");
		assertThat(service.judge(new BigDecimal("219.9"), MIN, MAX)).isEqualTo("OK");
	}

	@ParameterizedTest(name = "min={0} max={1} sunpou={2} → {3}")
	@DisplayName("他の規格での代表ケース")
	@CsvSource({
			"99.500, 100.500, 100.000, OK",
			"99.500, 100.500,  99.500, OK",
			"99.500, 100.500, 100.490, OK",
			"99.500, 100.500, 100.491, 再検査",
			"99.500, 100.500, 100.500, 再検査",
			"99.500, 100.500,  99.499, NG",
			"99.500, 100.500, 100.501, NG",
			"10.000,  10.005,  10.003, 再検査",
			"10.000,  10.005,  10.000, 再検査",
			"0.000,    1.000,   0.000, OK"
	})
	void otherSpecifications(String min, String max, String sunpou, String expected) {
		assertThat(service.judge(new BigDecimal(sunpou), new BigDecimal(min), new BigDecimal(max)))
				.isEqualTo(expected);
	}
}
