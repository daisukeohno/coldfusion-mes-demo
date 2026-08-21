package jp.co.seizo.mes.inspection;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import jp.co.seizo.mes.inspection.dto.DefectSummary;
import jp.co.seizo.mes.inspection.dto.InspectionRecord;
import jp.co.seizo.mes.inspection.dto.InspectionRequest;
import jp.co.seizo.mes.inspection.dto.InspectionResponse;
import jp.co.seizo.mes.inspection.dto.OrderOption;

/** 検査登録・参照のユースケース。判定そのものは {@link InspectionJudgmentService} に委譲する。 */
@Service
public class InspectionService {

	static final String MSG_SUNPOU_NOT_NUMERIC = "測定値は数値で入力してください。";
	static final String MSG_KIJUN_NOT_NUMERIC = "規格下限・規格上限は数値で入力してください。";

	private final InspectionRepository repository;
	private final InspectionJudgmentService judgmentService;

	public InspectionService(InspectionRepository repository, InspectionJudgmentService judgmentService) {
		this.repository = repository;
		this.judgmentService = judgmentService;
	}

	public List<InspectionRecord> findInspections(String shijiNo, String hantei) {
		return repository.findInspections(shijiNo, hantei);
	}

	public List<DefectSummary> findDefectSummary() {
		return repository.findDefectSummary();
	}

	public List<OrderOption> findOrdersForInspection() {
		return repository.findOrdersForInspection();
	}

	public InspectionResponse register(InspectionRequest request) {
		BigDecimal sunpou = parseNumeric(request.getSunpou(), MSG_SUNPOU_NOT_NUMERIC);
		BigDecimal kijunMin = parseNumeric(request.getKijunMin(), MSG_KIJUN_NOT_NUMERIC);
		BigDecimal kijunMax = parseNumeric(request.getKijunMax(), MSG_KIJUN_NOT_NUMERIC);

		String hantei = judgmentService.judge(sunpou, kijunMin, kijunMax);

		int kensaId = repository.insert(
				request.getShijiNo(),
				request.getLotNo(),
				request.getKensaSha(),
				judgmentService.toDbScale(sunpou),
				judgmentService.toDbScale(kijunMin),
				judgmentService.toDbScale(kijunMax),
				hantei,
				request.getFuryoNaiyo() == null ? "" : request.getFuryoNaiyo());

		return InspectionResponse.registered(hantei, kensaId);
	}

	private BigDecimal parseNumeric(String value, String errorMessage) {
		if (value == null || value.isBlank()) {
			throw new InspectionValidationException(errorMessage);
		}
		try {
			return new BigDecimal(value.trim());
		}
		catch (NumberFormatException ex) {
			throw new InspectionValidationException(errorMessage);
		}
	}
}
