package jp.seizo.mes.inspection;

import static jp.seizo.mes.inspection.InspectionJudgmentService.NG;
import static jp.seizo.mes.inspection.InspectionJudgmentService.OK;
import static jp.seizo.mes.inspection.InspectionJudgmentService.RE_INSPECTION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNullPointerException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;

class InspectionJudgmentServiceTest {

	private final InspectionJudgmentService service = new InspectionJudgmentService();

	/** 代表規格 (kijun_min, kijun_max)。いずれも幅が 0.010 より十分大きい。 */
	private static final List<BigDecimal[]> SPECS = List.of(spec("219.900", "220.100"), spec("44.980", "45.020"),
			spec("99.500", "100.500"), spec("0.000", "0.050"), spec("-0.100", "0.100"));

	static Stream<Arguments> boundaryCases() {
		return SPECS.stream().flatMap(spec -> {
			BigDecimal min = spec[0];
			BigDecimal max = spec[1];
			BigDecimal mid = min.add(max).divide(d("2"), 3, RoundingMode.HALF_UP);
			return Stream.of(
					Arguments.of("sunpou < kijun_min", min.subtract(d("0.001")), min, max, NG),
					Arguments.of("sunpou == kijun_min (下限は再検査対象外)", min, min, max, OK),
					Arguments.of("sunpou == kijun_min + 0.001", min.add(d("0.001")), min, max, OK),
					Arguments.of("sunpou > kijun_max", max.add(d("0.001")), min, max, NG),
					Arguments.of("sunpou == kijun_max (差 0.000)", max, min, max, RE_INSPECTION),
					Arguments.of("sunpou == kijun_max - 0.001", max.subtract(d("0.001")), min, max, RE_INSPECTION),
					Arguments.of("sunpou == kijun_max - 0.009", max.subtract(d("0.009")), min, max, RE_INSPECTION),
					Arguments.of("sunpou == kijun_max - 0.010 (差ちょうど 0.010)", max.subtract(d("0.010")), min, max,
							OK),
					Arguments.of("sunpou == kijun_max - 0.011", max.subtract(d("0.011")), min, max, OK),
					Arguments.of("範囲中央値", mid, min, max, OK));
		});
	}

	@ParameterizedTest(name = "[{index}] {0}: sunpou={1}, 規格={2}〜{3} → {4}")
	@MethodSource("boundaryCases")
	void judgesBoundaries(String caseName, BigDecimal sunpou, BigDecimal kijunMin, BigDecimal kijunMax,
			String expected) {
		assertThat(service.judge(sunpou, kijunMin, kijunMax)).isEqualTo(expected);
	}

	@ParameterizedTest(name = "sunpou={0} → {1}")
	@CsvSource({
			"219.899, NG",
			"219.900, OK",
			"219.901, OK",
			"219.905, OK",
			"220.000, OK",
			"220.089, OK",
			"220.090, OK",
			"220.091, 再検査",
			"220.099, 再検査",
			"220.100, 再検査",
			"220.101, NG" })
	void judgesRepresentativeSpecTable(String sunpou, String expected) {
		assertThat(service.judge(d(sunpou), d("219.900"), d("220.100"))).isEqualTo(expected);
	}

	@Test
	void lowerLimitSideIsNeverReInspection() {
		BigDecimal min = d("219.900");
		BigDecimal max = d("220.100");
		for (BigDecimal sunpou = min; sunpou.compareTo(min.add(d("0.020"))) <= 0; sunpou = sunpou.add(d("0.001"))) {
			assertThat(service.judge(sunpou, min, max)).as("sunpou=%s", sunpou).isEqualTo(OK);
		}
	}

	@Test
	void ngTakesPrecedenceOverReInspectionAboveUpperLimit() {
		assertThat(service.judge(d("220.105"), d("219.900"), d("220.100"))).isEqualTo(NG);
	}

	@ParameterizedTest(name = "kijun_max={0}, sunpou={1} (差ちょうど 0.010) → OK")
	@CsvSource({ "220.100, 220.090", "1.007, 0.997", "1.630, 1.620", "2.050, 2.040", "100.010, 100.000" })
	void exactMarginIsOkWithoutFloatingPointError(String kijunMax, String sunpou) {
		// double では (kijunMax - sunpou) が 0.00999999... となり得る値の組
		assertThat(service.judge(d(sunpou), d("0.000"), d(kijunMax))).isEqualTo(OK);
	}

	@Test
	void comparisonIgnoresScale() {
		assertThat(service.judge(d("220.09"), d("219.9"), d("220.1"))).isEqualTo(OK);
		assertThat(service.judge(d("220.0910"), d("219.9000"), d("220.1000"))).isEqualTo(RE_INSPECTION);
	}

	@Test
	void narrowSpecAppliesUpperSideRuleEvenAtLowerLimit() {
		// 規格幅が 0.010 未満の場合、上限側ルールにより下限ちょうどでも再検査となる (旧画面と同じ評価順)
		assertThat(service.judge(d("10.000"), d("10.000"), d("10.005"))).isEqualTo(RE_INSPECTION);
	}

	@Test
	void rejectsMissingValues() {
		assertThatNullPointerException().isThrownBy(() -> service.judge(null, d("219.900"), d("220.100")));
		assertThatNullPointerException().isThrownBy(() -> service.judge(d("220.000"), null, d("220.100")));
		assertThatNullPointerException().isThrownBy(() -> service.judge(d("220.000"), d("219.900"), null));
	}

	private static BigDecimal[] spec(String min, String max) {
		return new BigDecimal[] { d(min), d(max) };
	}

	private static BigDecimal d(String value) {
		return new BigDecimal(value);
	}

}
