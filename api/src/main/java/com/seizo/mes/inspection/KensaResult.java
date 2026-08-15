package com.seizo.mes.inspection;

import java.math.BigDecimal;
import java.time.LocalDate;

/** 検査結果 (t_kensa の1行 + 一覧表示用の結合項目)。 */
public record KensaResult(
        long kensaId,
        String shijiNo,
        String hinmokuNm,
        String lineCd,
        String lotNo,
        LocalDate kensaYmd,
        String kensaSha,
        BigDecimal sunpou,
        BigDecimal kijunMin,
        BigDecimal kijunMax,
        String hantei,
        String furyoNaiyo) {
}
