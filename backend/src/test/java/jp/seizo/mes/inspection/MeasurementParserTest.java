package jp.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import java.math.BigDecimal;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class MeasurementParserTest {

	private final MeasurementParser parser = new MeasurementParser();

	@ParameterizedTest(name = "\"{0}\" → {1}")
	@CsvSource({ "220.000, 220.000", "220.1, 220.100", "' 219.900 ', 219.900", "220, 220.000", "-0.5, -0.500",
			"99999.999, 99999.999", "220.1000, 220.100", ".5, 0.500", "2.2E2, 220.000" })
	void parsesDecimal83(String raw, String expected) {
		BigDecimal parsed = parser.parse("sunpou", "測定値", raw);
		assertThat(parsed).isEqualTo(new BigDecimal(expected));
	}

	@ParameterizedTest(name = "\"{0}\" は数値エラー")
	@NullAndEmptySource
	@ValueSource(strings = { " ", "abc", "220.0.0", "２２０．０００", "２２０", "1,000", "220mm", "0x10", "NaN", "Infinity" })
	void rejectsNonNumericOrMissing(String raw) {
		assertThatExceptionOfType(InvalidMeasurementException.class)
			.isThrownBy(() -> parser.parse("sunpou", "測定値", raw))
			.withMessage("測定値は数値で入力してください。")
			.satisfies(ex -> assertThat(ex.getField()).isEqualTo("sunpou"));
	}

	@ParameterizedTest(name = "\"{0}\" は DECIMAL(8,3) 範囲外")
	@ValueSource(strings = { "220.0001", "100000.000", "123456" })
	void rejectsValuesOutsideDecimal83(String raw) {
		assertThatExceptionOfType(InvalidMeasurementException.class)
			.isThrownBy(() -> parser.parse("sunpou", "測定値", raw))
			.withMessage("測定値は整数部5桁・小数部3桁以内で入力してください。");
	}

}
