package com.seizo.mes.inspection;

import java.math.BigDecimal;
import java.time.LocalDate;

/** 検査履歴 1 行 (現行 qKensa 相当)。 */
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
        String furyoNaiyo) {}
