package com.seizo.mes.inspection;

import com.fasterxml.jackson.annotation.JsonProperty;

/** 不良内容集計1行 (旧 qFuryo)。 */
public record DefectSummary(
        @JsonProperty("furyo_naiyo") String furyoNaiyo,
        @JsonProperty("ken") long ken) {
}
