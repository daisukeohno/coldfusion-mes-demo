package com.seizo.mes.inspection;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;

/**
 * 品質検査の判定ロジック。
 *
 * <p>現行 {@code app/inspection.cfm} (行14-21) に画面へ直接埋め込まれていた判定を、純関数として
 * 切り出したもの。DB / HTTP には一切依存しない。判定順序と境界の扱いは現行と完全に同一。
 *
 * <ol>
 *   <li>初期値は OK</li>
 *   <li>測定値が規格下限未満 または 規格上限超過 なら NG (境界値そのものは範囲内 = OK 扱い)</li>
 *   <li>OK かつ 規格上限との差が {@link #SAIKENSA_THRESHOLD} 未満なら 再検査</li>
 * </ol>
 *
 * <p>t_kensa の各列は DECIMAL(8,3) のため、比較は浮動小数の誤差が出ない {@link BigDecimal}
 * (スケール3) で行う。
 */
@Service
public class InspectionJudgmentService {

    /**
     * 再検査と判定する規格上限との差 (mm)。
     *
     * <p>2011年暫定運用・上限側のみ: 規格上限との差がこの値未満のときだけ再検査とする。下限側には
     * 同等の判定が無く (非対称)、差がこの値ちょうどの場合は厳密不等号のため OK のまま。現行の
     * 挙動をそのまま保持する。
     */
    public static final BigDecimal SAIKENSA_THRESHOLD = new BigDecimal("0.010");

    /** DECIMAL(8,3) 相当のスケール。 */
    private static final int SCALE = 3;

    /**
     * 測定値と規格値から判定を返す。
     *
     * @param sunpou 測定値 (mm)
     * @param kijunMin 規格下限 (mm)
     * @param kijunMax 規格上限 (mm)
     * @return OK / NG / 再検査
     * @throws IllegalArgumentException いずれかが null の場合
     */
    public Hantei judge(BigDecimal sunpou, BigDecimal kijunMin, BigDecimal kijunMax) {
        if (sunpou == null || kijunMin == null || kijunMax == null) {
            throw new IllegalArgumentException("\u6e2c\u5b9a\u5024\u3068\u898f\u683c\u5024\u306f\u5fc5\u9808\u3067\u3059\u3002");
        }
        BigDecimal measured = scaled(sunpou);
        BigDecimal min = scaled(kijunMin);
        BigDecimal max = scaled(kijunMax);

        if (measured.compareTo(min) < 0 || measured.compareTo(max) > 0) {
            return Hantei.NG;
        }
        if (max.subtract(measured).compareTo(SAIKENSA_THRESHOLD) < 0) {
            return Hantei.SAIKENSA;
        }
        return Hantei.OK;
    }

    private static BigDecimal scaled(BigDecimal value) {
        return value.setScale(SCALE, java.math.RoundingMode.HALF_UP);
    }
}
