package com.seizo.mes.inspection;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDate;

/** 検査履歴1行 (t_kensa + m_hinmoku.hinmoku_nm + t_seizou_shiji.line_cd)。 */
public record InspectionRecord(
        @JsonProperty("kensa_id") long kensaId,
        @JsonProperty("shiji_no") String shijiNo,
        @JsonProperty("hinmoku_nm") String hinmokuNm,
        @JsonProperty("line_cd") String lineCd,
        @JsonProperty("lot_no") String lotNo,
        @JsonProperty("kensa_ymd") LocalDate kensaYmd,
        @JsonProperty("kensa_sha") String kensaSha,
        @JsonProperty("sunpou") BigDecimal sunpou,
        @JsonProperty("kijun_min") BigDecimal kijunMin,
        @JsonProperty("kijun_max") BigDecimal kijunMax,
        @JsonProperty("hantei") Hantei hantei,
        @JsonProperty("furyo_naiyo") String furyoNaiyo) {
}
