package com.seizo.mes.inspection;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;

/**
 * 品質検査の判定ロジック。
 *
 * <p>現行 {@code app/inspection.cfm} に埋め込まれていた判定を純粋関数として切り出したもの。
 * DB / HTTP には依存しない。
 *
 * <ul>
 *   <li>初期値は OK</li>
 *   <li>規格範囲外 (下限未満 / 上限超過) は NG</li>
 *   <li>OK かつ規格上限との差が {@link #RECHECK_THRESHOLD} 未満なら 再検査
 *       (2011年の暫定運用。差が閾値ちょうどの場合は OK のまま)</li>
 * </ul>
 *
 * 比較は浮動小数の誤差を避けるため {@link BigDecimal} で行う。
 */
@Service
public class InspectionJudgmentService {

    /** 判定結果: 規格内。 */
    public static final String HANTEI_OK = "OK";

    /** 判定結果: 規格外。 */
    public static final String HANTEI_NG = "NG";

    /** 判定結果: 規格内だが上限ぎりぎり。 */
    public static final String HANTEI_RECHECK = "再検査";

    /**
     * 再検査と判定する規格上限との差 (mm)。現行はマスタ化されず画面に直接書かれていたため、
     * ここ1箇所に定数として集約する。挙動は現行と同一 (差がこの値未満のときのみ再検査)。
     */
    public static final BigDecimal RECHECK_THRESHOLD = new BigDecimal("0.010");

    /**
     * 測定値と規格から判定を返す。
     *
     * @param sunpou 測定値 (mm)
     * @param kijunMin 規格下限 (mm)
     * @param kijunMax 規格上限 (mm)
     * @return "OK" / "NG" / "再検査"
     */
    public String judge(BigDecimal sunpou, BigDecimal kijunMin, BigDecimal kijunMax) {
        if (sunpou == null || kijunMin == null || kijunMax == null) {
            throw new IllegalArgumentException("測定値と規格値は必須です。");
        }
        if (sunpou.compareTo(kijunMin) < 0 || sunpou.compareTo(kijunMax) > 0) {
            return HANTEI_NG;
        }
        if (kijunMax.subtract(sunpou).compareTo(RECHECK_THRESHOLD) < 0) {
            return HANTEI_RECHECK;
        }
        return HANTEI_OK;
    }
}
