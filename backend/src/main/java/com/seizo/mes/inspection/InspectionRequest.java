package com.seizo.mes.inspection;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** POST /api/inspections リクエスト。旧画面の form フィールド名をそのまま採用する。 */
public record InspectionRequest(
        @JsonProperty("shiji_no") @NotBlank @Size(max = 20) String shijiNo,
        @JsonProperty("lot_no") @Size(max = 30) String lotNo,
        @JsonProperty("kensa_sha") @Size(max = 60) String kensaSha,
        @JsonProperty("sunpou") @NotNull @Digits(integer = 5, fraction = 3) BigDecimal sunpou,
        @JsonProperty("kijun_min") @NotNull @Digits(integer = 5, fraction = 3) BigDecimal kijunMin,
        @JsonProperty("kijun_max") @NotNull @Digits(integer = 5, fraction = 3) BigDecimal kijunMax,
        @JsonProperty("furyo_naiyo") @Size(max = 255) String furyoNaiyo) {
}
