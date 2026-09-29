package jp.seizo.mes.inspection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;

class InspectionRegistrationServiceTest {

	private InspectionJudgmentService judgmentService;

	private InspectionRepository repository;

	private InspectionRegistrationService service;

	@BeforeEach
	void setUp() {
		judgmentService = spy(new InspectionJudgmentService());
		repository = mock(InspectionRepository.class);
		service = new InspectionRegistrationService(new MeasurementParser(), judgmentService, repository);
	}

	@ParameterizedTest(name = "sunpou=\"{0}\" は判定・登録に到達しない")
	@NullAndEmptySource
	@ValueSource(strings = { " ", "abc", "220.0.0" })
	void nonNumericSunpouNeverReachesJudgmentOrInsert(String sunpou) {
		assertThatExceptionOfType(InvalidMeasurementException.class)
			.isThrownBy(() -> service.register(request(sunpou, "219.900", "220.100")))
			.withMessage("測定値は数値で入力してください。");
		verifyNoInteractions(judgmentService, repository);
	}

	@Test
	void nonNumericLimitsNeverReachJudgmentOrInsert() {
		assertThatExceptionOfType(InvalidMeasurementException.class)
			.isThrownBy(() -> service.register(request("220.000", "x", "220.100")))
			.withMessage("規格下限は数値で入力してください。");
		assertThatExceptionOfType(InvalidMeasurementException.class)
			.isThrownBy(() -> service.register(request("220.000", "219.900", "")))
			.withMessage("規格上限は数値で入力してください。");
		verifyNoInteractions(judgmentService, repository);
	}

	@Test
	void insertsJudgedResultAndReturnsLegacyMessage() {
		when(repository.insert(any())).thenReturn(42L);

		InspectionCreatedResponse response = service.register(request("220.095", "219.900", "220.100"));

		assertThat(response.kensaId()).isEqualTo(42L);
		assertThat(response.hantei()).isEqualTo("再検査");
		assertThat(response.message()).isEqualTo("検査結果を登録しました。判定は 再検査 です。");
		ArgumentCaptor<NewInspection> captor = ArgumentCaptor.forClass(NewInspection.class);
		verify(repository).insert(captor.capture());
		NewInspection saved = captor.getValue();
		assertThat(saved.hantei()).isEqualTo("再検査");
		assertThat(saved.sunpou()).isEqualTo(new BigDecimal("220.095"));
		assertThat(saved.furyoNaiyo()).isEmpty();
	}

	@Test
	void doesNotInsertWhenJudgmentFails() {
		assertThatExceptionOfType(InvalidMeasurementException.class)
			.isThrownBy(() -> service.register(request("220.0001", "219.900", "220.100")));
		verify(repository, never()).insert(any());
	}

	private static InspectionRequest request(String sunpou, String kijunMin, String kijunMax) {
		return new InspectionRequest("SJ-2608-0014", "LOT-0929-01", "高橋 花子", sunpou, kijunMin, kijunMax, null);
	}

}
