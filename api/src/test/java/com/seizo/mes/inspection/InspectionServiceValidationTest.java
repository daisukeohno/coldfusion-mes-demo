package com.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;

import java.time.Clock;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mockito;

/** 非数値・未入力は登録されない (現行 isNumeric 相当) ことの検証。 */
class InspectionServiceValidationTest {

    private final InspectionRepository repository = Mockito.mock(InspectionRepository.class);
    private final InspectionService service = new InspectionService(
            new InspectionJudgmentService(), repository, Clock.system(ZoneId.of("Asia/Tokyo")));

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"abc", "220.0mm", "  "})
    void rejectsNonNumericSunpou(String sunpou) {
        InspectionRequest request = request();
        request.setSunpou(sunpou);

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(ValidationException.class)
                .hasMessage(InspectionService.MSG_SUNPOU_NOT_NUMERIC);
        verifyNoInteractions(repository);
    }

    @Test
    void rejectsNonNumericKijun() {
        InspectionRequest request = request();
        request.setKijunMax("--");

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(ValidationException.class)
                .hasMessage(InspectionService.MSG_KIJUN_NOT_NUMERIC);
        verifyNoInteractions(repository);
    }

    @Test
    void rejectsMissingShijiNo() {
        InspectionRequest request = request();
        request.setShijiNo("");

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(ValidationException.class)
                .hasMessage(InspectionService.MSG_SHIJI_NO_REQUIRED);
        verifyNoInteractions(repository);
    }

    @Test
    void messageContainsHantei() {
        InspectionRequest request = request();
        request.setSunpou("220.100");

        InspectionResponse response = service.register(request);

        assertThat(response.hantei()).isEqualTo(Hantei.SAIKENSA);
        assertThat(response.message()).contains(Hantei.SAIKENSA.value());
    }

    private static InspectionRequest request() {
        InspectionRequest request = new InspectionRequest();
        request.setShijiNo("SJ-2024-0001");
        request.setLotNo("LOT-0101-01");
        request.setKensaSha("\u9ad8\u6a4b \u82b1\u5b50");
        request.setSunpou("220.000");
        request.setKijunMin("219.900");
        request.setKijunMax("220.100");
        request.setFuryoNaiyo("");
        return request;
    }
}
