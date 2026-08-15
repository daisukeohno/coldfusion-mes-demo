package com.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * 判定ロジックの境界値テスト。基準は 現行画面の初期値 min=219.900 / max=220.100。
 * 現行 app/inspection.cfm の挙動を正解として固定する。
 */
class InspectionJudgmentServiceTest {

    private static final BigDecimal MIN = new BigDecimal("219.900");
    private static final BigDecimal MAX = new BigDecimal("220.100");

    private final InspectionJudgmentService service = new InspectionJudgmentService();

    @ParameterizedTest(name = "測定値 {0} -> {1}")
    @CsvSource({
        "219.899, NG",       // 下限未満
        "219.900, OK",       // 下限ちょうど
        "219.901, OK",
        "220.000, OK",
        "220.089, OK",
        "220.090, OK",       // 上限との差が 0.010 ちょうど (等号を含まないため OK)
        "220.091, 再検査",   // 上限との差が 0.010 未満
        "220.100, 再検査",   // 上限ちょうど (差 0)
        "220.101, NG",       // 上限超過
    })
    void judgeBoundaryValues(String sunpou, String expected) {
        assertThat(service.judge(new BigDecimal(sunpou), MIN, MAX)).isEqualTo(expected);
    }

    @Test
    @DisplayName("小数桁の表記揺れ (220.09 / 220.0900) でも上限差 0.010 は OK のまま")
    void judgeIsScaleInsensitive() {
        assertThat(service.judge(new BigDecimal("220.09"), MIN, MAX))
                .isEqualTo(InspectionJudgmentService.HANTEI_OK);
        assertThat(service.judge(new BigDecimal("220.0900"), MIN, MAX))
                .isEqualTo(InspectionJudgmentService.HANTEI_OK);
        assertThat(service.judge(new BigDecimal("220.09"), new BigDecimal("219.9"), new BigDecimal("220.1")))
                .isEqualTo(InspectionJudgmentService.HANTEI_OK);
    }

    @Test
    @DisplayName("double 演算では誤差で 0.010 未満に見える値でも BigDecimal 判定では OK")
    void judgeAvoidsFloatingPointError() {
        // 220.1 - 220.09 = 0.009999999999990905 (double) となり誤って 再検査 になる
        assertThat(220.1d - 220.09d).isLessThan(0.010d);
        assertThat(service.judge(new BigDecimal("220.09"), MIN, MAX))
                .isEqualTo(InspectionJudgmentService.HANTEI_OK);
    }

    @Test
    @DisplayName("下限と上限が同値でも上限差 0 で 再検査")
    void judgeWhenMinEqualsMax() {
        assertThat(service.judge(new BigDecimal("220.000"), new BigDecimal("220.000"), new BigDecimal("220.000")))
                .isEqualTo(InspectionJudgmentService.HANTEI_RECHECK);
    }

    @Test
    @DisplayName("測定値・規格値が欠落している場合は例外")
    void judgeRejectsNull() {
        assertThatThrownBy(() -> service.judge(null, MIN, MAX)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.judge(new BigDecimal("220.000"), null, MAX))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.judge(new BigDecimal("220.000"), MIN, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("再検査閾値は 0.010 の1箇所定義")
    void thresholdIsSingleSourceOfTruth() {
        assertThat(InspectionJudgmentService.RECHECK_THRESHOLD).isEqualByComparingTo("0.010");
    }
}
