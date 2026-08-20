package com.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * 判定ロジックの境界値テスト。現行 CFML の挙動 (下限側は再検査判定しない / 上限差 0.010 ちょうどは OK)
 * を仕様として固定する。
 */
class InspectionJudgmentServiceTest {

    private static final BigDecimal KIJUN_MIN = new BigDecimal("219.900");
    private static final BigDecimal KIJUN_MAX = new BigDecimal("220.100");

    private final InspectionJudgmentService service = new InspectionJudgmentService();

    @ParameterizedTest(name = "sunpou={0} -> {1}")
    @CsvSource({
        "219.900, OK",       // 下限ちょうど: 範囲内 = OK (厳密不等号)
        "219.899, NG",       // 下限未満
        "220.101, NG",       // 上限超過
        "220.100, SAIKENSA", // 上限ちょうど: 上限差 0.000 < 0.010 -> 再検査
        "220.091, SAIKENSA", // 上限差 0.009
        "220.090, OK",       // 上限差 0.010 ちょうど: < 判定が偽になるため OK
        "219.905, OK",       // 下限側に近接しても再検査にしない (下限側は非対称で判定なし)
        "220.000, OK",       // 中央
    })
    void judgesBoundaries(String sunpou, Hantei expected) {
        assertThat(service.judge(new BigDecimal(sunpou), KIJUN_MIN, KIJUN_MAX)).isEqualTo(expected);
    }

    @Test
    @DisplayName("下限ちょうどでも下限差による再検査判定はしない (上限側のみの非対称性)")
    void doesNotRecheckOnLowerBound() {
        assertThat(service.judge(new BigDecimal("219.900"), KIJUN_MIN, KIJUN_MAX)).isEqualTo(Hantei.OK);
        assertThat(service.judge(new BigDecimal("219.901"), KIJUN_MIN, KIJUN_MAX)).isEqualTo(Hantei.OK);
    }

    @Test
    @DisplayName("NG が先に確定した場合は再検査に上書きされない")
    void ngTakesPrecedence() {
        assertThat(service.judge(new BigDecimal("220.500"), KIJUN_MIN, KIJUN_MAX)).isEqualTo(Hantei.NG);
    }

    @Test
    @DisplayName("スケール違いの入力でも DECIMAL(8,3) 相当で同じ判定になる")
    void scaleIndependent() {
        assertThat(service.judge(new BigDecimal("220.09"), KIJUN_MIN, KIJUN_MAX)).isEqualTo(Hantei.OK);
        assertThat(service.judge(new BigDecimal("220.0900"), KIJUN_MIN, KIJUN_MAX)).isEqualTo(Hantei.OK);
        assertThat(service.judge(new BigDecimal("2.201E+2"), KIJUN_MIN, KIJUN_MAX)).isEqualTo(Hantei.SAIKENSA);
    }

    @Test
    @DisplayName("再検査閾値は 0.010 (2011年暫定運用)")
    void thresholdConstant() {
        assertThat(InspectionJudgmentService.SAIKENSA_THRESHOLD).isEqualByComparingTo("0.010");
    }

    @Test
    @DisplayName("null は判定不能")
    void nullIsRejected() {
        assertThatThrownBy(() -> service.judge(null, KIJUN_MIN, KIJUN_MAX))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.judge(new BigDecimal("220.000"), null, KIJUN_MAX))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.judge(new BigDecimal("220.000"), KIJUN_MIN, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
