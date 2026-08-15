package com.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** 登録時の入力検証。現行画面と同じメッセージで弾き、DB へは書かない。 */
@ExtendWith(MockitoExtension.class)
class InspectionServiceValidationTest {

    @Mock
    private InspectionRepository repository;

    private InspectionService service() {
        return new InspectionService(new InspectionJudgmentService(), repository);
    }

    private static InspectionRequest request(String sunpou) {
        InspectionRequest req = new InspectionRequest();
        req.setShijiNo("SJ-2024-0001");
        req.setLotNo("LOT-0101-01");
        req.setKensaSha("高橋 花子");
        req.setSunpou(sunpou);
        req.setKijunMin("219.900");
        req.setKijunMax("220.100");
        req.setFuryoNaiyo("");
        return req;
    }

    @Test
    @DisplayName("測定値が非数値なら現行同等メッセージで検証エラー")
    void rejectsNonNumericSunpou() {
        InspectionService service = service();
        assertThatThrownBy(() -> service.register(request("abc")))
                .isInstanceOf(ValidationException.class)
                .hasMessage("測定値は数値で入力してください。");
        verify(repository, never())
                .insert(anyString(), anyString(), anyString(), any(), any(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("測定値が欠落・空でも検証エラー")
    void rejectsMissingSunpou() {
        InspectionService service = service();
        assertThatThrownBy(() -> service.register(request(null))).isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> service.register(request("   "))).isInstanceOf(ValidationException.class);
    }

    @Test
    @DisplayName("規格値が非数値なら検証エラー")
    void rejectsNonNumericKijun() {
        InspectionRequest req = request("220.000");
        req.setKijunMax("");
        InspectionService service = service();
        assertThatThrownBy(() -> service.register(req))
                .isInstanceOf(ValidationException.class)
                .hasMessage("規格下限と規格上限は数値で入力してください。");
    }

    @Test
    @DisplayName("正常系は判定結果を t_kensa に登録しメッセージを返す")
    void registersJudgedResult() {
        when(repository.insert(anyString(), anyString(), anyString(), any(), any(), any(), anyString(), anyString()))
                .thenReturn(42L);

        InspectionResponse res = service().register(request("220.091"));

        assertThat(res.hantei()).isEqualTo("再検査");
        assertThat(res.message()).isEqualTo("検査結果を登録しました。判定は 再検査 です。");

        ArgumentCaptor<BigDecimal> sunpou = ArgumentCaptor.forClass(BigDecimal.class);
        ArgumentCaptor<String> hantei = ArgumentCaptor.forClass(String.class);
        verify(repository).insert(
                anyString(), anyString(), anyString(),
                sunpou.capture(), any(), any(), hantei.capture(), anyString());
        assertThat(sunpou.getValue()).isEqualByComparingTo("220.091");
        assertThat(hantei.getValue()).isEqualTo("再検査");
        verify(repository).findById(42L);
    }
}
