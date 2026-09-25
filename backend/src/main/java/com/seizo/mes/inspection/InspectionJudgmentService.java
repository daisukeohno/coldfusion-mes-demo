package com.seizo.mes.inspection;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;

/**
 * 検査判定ロジック (旧 app/inspection.cfm L9-21 から抽出)。
 *
 * <ol>
 *   <li>初期値は OK</li>
 *   <li>sunpou &lt; kijunMin または sunpou &gt; kijunMax なら NG</li>
 *   <li>OK かつ (kijunMax - sunpou) &lt; 0.010 なら 再検査 (2011年 暫定運用。閾値ちょうどは OK)</li>
 * </ol>
 *
 * DB/HTTP に依存しない純粋関数。DECIMAL(8,3) の丸め誤差を避けるため BigDecimal で比較する。
 */
@Service
public class InspectionJudgmentService {

    public static final BigDecimal SAIKENSA_THRESHOLD = new BigDecimal("0.010");

    public Hantei judge(BigDecimal sunpou, BigDecimal kijunMin, BigDecimal kijunMax) {
        if (sunpou == null || kijunMin == null || kijunMax == null) {
            throw new IllegalArgumentException("sunpou, kijunMin, kijunMax are required");
        }
        Hantei hantei = Hantei.OK;
        if (sunpou.compareTo(kijunMin) < 0 || sunpou.compareTo(kijunMax) > 0) {
            hantei = Hantei.NG;
        }
        if (hantei == Hantei.OK && kijunMax.subtract(sunpou).compareTo(SAIKENSA_THRESHOLD) < 0) {
            hantei = Hantei.SAIKENSA;
        }
        return hantei;
    }
}
