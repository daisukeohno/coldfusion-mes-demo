package jp.co.seizo.mes.inspection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** 不良内容集計の1行。 */
public record DefectSummary(
		@JsonProperty("furyo_naiyo") String furyoNaiyo,
		@JsonProperty("ken") long ken) {
}
