package jp.seizo.mes.inspection;

import java.math.BigDecimal;
import java.util.Objects;

import org.springframework.stereotype.Service;

/**
 * 検査結果の登録。数値検証 → 判定 → t_kensa への INSERT の順に行い、数値でなければ登録しない。
 */
@Service
public class InspectionRegistrationService {

	private final MeasurementParser measurementParser;

	private final InspectionJudgmentService judgmentService;

	private final InspectionRepository repository;

	public InspectionRegistrationService(MeasurementParser measurementParser,
			InspectionJudgmentService judgmentService, InspectionRepository repository) {
		this.measurementParser = measurementParser;
		this.judgmentService = judgmentService;
		this.repository = repository;
	}

	public InspectionCreatedResponse register(InspectionRequest request) {
		BigDecimal sunpou = measurementParser.parse("sunpou", "測定値", request.sunpou());
		BigDecimal kijunMin = measurementParser.parse("kijun_min", "規格下限", request.kijunMin());
		BigDecimal kijunMax = measurementParser.parse("kijun_max", "規格上限", request.kijunMax());

		String hantei = judgmentService.judge(sunpou, kijunMin, kijunMax);

		long kensaId = repository.insert(new NewInspection(request.shijiNo(), emptyIfNull(request.lotNo()),
				emptyIfNull(request.kensaSha()), sunpou, kijunMin, kijunMax, hantei,
				emptyIfNull(request.furyoNaiyo())));
		return new InspectionCreatedResponse(kensaId, hantei, "検査結果を登録しました。判定は " + hantei + " です。");
	}

	private static String emptyIfNull(String value) {
		return Objects.requireNonNullElse(value, "");
	}

}
