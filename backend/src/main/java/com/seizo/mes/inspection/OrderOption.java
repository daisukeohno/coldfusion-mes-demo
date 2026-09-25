package com.seizo.mes.inspection;

import com.fasterxml.jackson.annotation.JsonProperty;

/** 製造指示ドロップダウン用 (旧 qShijiList)。 */
public record OrderOption(
        @JsonProperty("shiji_no") String shijiNo,
        @JsonProperty("hinmoku_nm") String hinmokuNm) {
}
