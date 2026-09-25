package com.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * 旧 inspection.cfm L9-21 の判定ロジックに対する境界値テスト。
 * 規格 219.900 - 220.100 を例に、上限側は 0.010 の閾値の前後 1/1000 mm を全て確認する。
 */
class InspectionJudgmentServiceTest {

    private static final BigDecimal MIN = new BigDecimal("219.900");
    private static final BigDecimal MAX = new BigDecimal("220.100");

    private final InspectionJudgmentService service = new InspectionJudgmentService();

    @ParameterizedTest(name = "sunpou={0} -> {1}")
    @CsvSource({
            // 下限側
            "219.900, OK",        // 下限ちょうど
            "219.899, NG",        // 下限より僅かに下
            // 範囲中央
            "220.000, OK",
            // 上限側 (2011年暫定運用: 差 < 0.010 は再検査)
            "220.100, 再検査",    // 上限ちょうど: 差=0 < 0.010
            "220.101, NG",        // 上限より僅かに上
            "220.091, 再検査",    // 差=0.009 < 0.010
            "220.090, OK",        // 差=0.010 は "less than" を満たさない
            "220.089, OK",        // 差=0.011
    })
    void judge_boundaries(String sunpou, String expected) {
        assertThat(service.judge(new BigDecimal(sunpou), MIN, MAX)).isEqualTo(Hantei.fromLabel(expected));
    }

    @Test
    @DisplayName("スケールが異なる表記でも数値として比較する (220.09 == 220.090)")
    void judge_isScaleInsensitive() {
        assertThat(service.judge(new BigDecimal("220.09"), MIN, MAX)).isEqualTo(Hantei.OK);
        assertThat(service.judge(new BigDecimal("220.1"), MIN, MAX)).isEqualTo(Hantei.SAIKENSA);
    }

    @Test
    @DisplayName("NG が優先され、上限超過は再検査にならない")
    void judge_ngTakesPrecedenceOverSaikensa() {
        assertThat(service.judge(new BigDecimal("999.999"), MIN, MAX)).isEqualTo(Hantei.NG);
    }

    @Test
    @DisplayName("規格幅が 0.010 未満なら範囲内は全て再検査")
    void judge_narrowRangeIsAlwaysSaikensa() {
        BigDecimal min = new BigDecimal("10.000");
        BigDecimal max = new BigDecimal("10.005");
        assertThat(service.judge(new BigDecimal("10.000"), min, max)).isEqualTo(Hantei.SAIKENSA);
        assertThat(service.judge(new BigDecimal("10.005"), min, max)).isEqualTo(Hantei.SAIKENSA);
    }

    @Test
    @DisplayName("測定値が欠損なら判定しない")
    void judge_rejectsNull() {
        assertThatThrownBy(() -> service.judge(null, MIN, MAX)).isInstanceOf(IllegalArgumentException.class);
    }
}
