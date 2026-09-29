package jp.seizo.mes.inspection;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 検査登録リクエスト。測定値・規格値は数値検証を {@link MeasurementParser} で行うため文字列で受ける。
 */
public record InspectionRequest(
		@NotBlank(message = "製造指示を選択してください。") @Size(max = 20, message = "製造指示は20文字以内で入力してください。") String shijiNo,
		@Size(max = 30, message = "ロットは30文字以内で入力してください。") String lotNo,
		@Size(max = 60, message = "検査者は60文字以内で入力してください。") String kensaSha,
		String sunpou,
		String kijunMin,
		String kijunMax,
		@Size(max = 255, message = "不良内容は255文字以内で入力してください。") String furyoNaiyo) {
}
