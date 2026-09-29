package jp.seizo.mes.inspection;

import java.math.BigDecimal;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * 測定値・規格値の数値検証。t_kensa の DECIMAL(8,3) に収まる10進数のみ受け付ける。
 */
@Component
public class MeasurementParser {

	static final int MAX_INTEGER_DIGITS = 5;
	static final int MAX_SCALE = 3;

	private static final Pattern DECIMAL_PATTERN = Pattern
		.compile("[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?");

	public BigDecimal parse(String field, String label, String raw) {
		if (raw == null || !DECIMAL_PATTERN.matcher(raw.strip()).matches()) {
			throw notNumeric(field, label);
		}
		BigDecimal value = new BigDecimal(raw.strip());
		BigDecimal normalized = value.stripTrailingZeros();
		int scale = Math.max(normalized.scale(), 0);
		int integerDigits = normalized.precision() - normalized.scale();
		if (scale > MAX_SCALE || integerDigits > MAX_INTEGER_DIGITS) {
			throw new InvalidMeasurementException(field,
					label + "は整数部" + MAX_INTEGER_DIGITS + "桁・小数部" + MAX_SCALE + "桁以内で入力してください。");
		}
		return value.setScale(MAX_SCALE);
	}

	private static InvalidMeasurementException notNumeric(String field, String label) {
		return new InvalidMeasurementException(field, label + "は数値で入力してください。");
	}

}
