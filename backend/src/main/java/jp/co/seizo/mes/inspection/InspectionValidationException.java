package jp.co.seizo.mes.inspection;

/** 入力バリデーションエラー (現行画面のメッセージをそのまま保持する)。 */
public class InspectionValidationException extends RuntimeException {

	public InspectionValidationException(String message) {
		super(message);
	}
}
