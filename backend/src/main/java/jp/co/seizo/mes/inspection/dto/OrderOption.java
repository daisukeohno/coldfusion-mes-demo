package jp.co.seizo.mes.inspection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** 製造指示ドロップダウン用の選択肢。 */
public record OrderOption(
		@JsonProperty("shiji_no") String shijiNo,
		@JsonProperty("hinmoku_nm") String hinmokuNm) {
}
