package com.seizo.mes.inspection;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * 検査結果の登録・参照のユースケース。判定そのものは {@link InspectionJudgmentService} に委譲し、
 * ここでは判定分岐を持たない。
 */
@Service
public class InspectionService {

    /** 現行画面と同一の検証メッセージ。 */
    static final String MSG_SUNPOU_NOT_NUMERIC = "\u6e2c\u5b9a\u5024\u306f\u6570\u5024\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";

    /** 規格値の検証メッセージ (現行は比較時に例外となりエラー画面になる)。 */
    static final String MSG_KIJUN_NOT_NUMERIC = "\u898f\u683c\u4e0b\u9650\u3068\u898f\u683c\u4e0a\u9650\u306f\u6570\u5024\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";

    /** 製造指示未選択時の検証メッセージ (現行は DB エラーがそのまま表示される)。 */
    static final String MSG_SHIJI_NO_REQUIRED = "\u88fd\u9020\u6307\u793a\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002";

    private final InspectionJudgmentService judgmentService;
    private final InspectionRepository repository;
    private final Clock clock;

    public InspectionService(
            InspectionJudgmentService judgmentService, InspectionRepository repository, Clock clock) {
        this.judgmentService = judgmentService;
        this.repository = repository;
        this.clock = clock;
    }

    public InspectionResponse register(InspectionRequest request) {
        if (isBlank(request.getShijiNo())) {
            throw new ValidationException(MSG_SHIJI_NO_REQUIRED);
        }
        BigDecimal sunpou = parse(request.getSunpou(), MSG_SUNPOU_NOT_NUMERIC);
        BigDecimal kijunMin = parse(request.getKijunMin(), MSG_KIJUN_NOT_NUMERIC);
        BigDecimal kijunMax = parse(request.getKijunMax(), MSG_KIJUN_NOT_NUMERIC);

        Hantei hantei = judgmentService.judge(sunpou, kijunMin, kijunMax);
        long kensaId = repository.insert(
                request.getShijiNo(),
                request.getLotNo(),
                LocalDate.now(clock),
                request.getKensaSha(),
                sunpou,
                kijunMin,
                kijunMax,
                hantei,
                request.getFuryoNaiyo() == null ? "" : request.getFuryoNaiyo());

        return new InspectionResponse(
                hantei,
                "\u691c\u67fb\u7d50\u679c\u3092\u767b\u9332\u3057\u307e\u3057\u305f\u3002\u5224\u5b9a\u306f " + hantei.value() + " \u3067\u3059\u3002",
                repository.findById(kensaId));
    }

    public List<KensaResult> search(String shijiNo, String hantei) {
        return repository.search(shijiNo, hantei);
    }

    public List<DefectSummary> defectSummary() {
        return repository.defectSummary();
    }

    public List<OrderForInspection> ordersForInspection() {
        return repository.findOrdersForInspection();
    }

    /** 現行の {@code isNumeric} 相当の検証。非数値・未入力は検証エラーとし、登録しない。 */
    private static BigDecimal parse(String value, String message) {
        if (isBlank(value)) {
            throw new ValidationException(message);
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            throw new ValidationException(message);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
