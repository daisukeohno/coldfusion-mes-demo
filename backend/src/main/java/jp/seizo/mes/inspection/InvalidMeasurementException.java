package jp.seizo.mes.inspection;

public class InvalidMeasurementException extends RuntimeException {

	private final String field;

	public InvalidMeasurementException(String field, String message) {
		super(message);
		this.field = field;
	}

	public String getField() {
		return field;
	}

}
