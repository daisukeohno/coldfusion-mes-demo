package com.seizo.mes.inspection;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;

/** 検査結果の登録・参照のユースケース。判定そのものは {@link InspectionJudgmentService} に委譲する。 */
@Service
public class InspectionService {

    /** 現行画面と同一の検証メッセージ。 */
    static final String MSG_SUNPOU_NOT_NUMERIC = "測定値は数値で入力してください。";

    /** 移行時に追加した検証。現行は規格値を検証せず、比較時の例外が onError でエラー画面になる。 */
    static final String MSG_KIJUN_NOT_NUMERIC = "規格下限と規格上限は数値で入力してください。";

    /** 移行時に追加した検証。現行は未選択時に DB エラーがそのまま画面表示される。 */
    static final String MSG_SHIJI_NO_REQUIRED = "製造指示を選択してください。";

    private final InspectionJudgmentService judgmentService;
    private final InspectionRepository repository;

    public InspectionService(InspectionJudgmentService judgmentService, InspectionRepository repository) {
        this.judgmentService = judgmentService;
        this.repository = repository;
    }

    public InspectionResponse register(InspectionRequest request) {
        if (request.getShijiNo() == null || request.getShijiNo().isBlank()) {
            throw new ValidationException(MSG_SHIJI_NO_REQUIRED);
        }
        BigDecimal sunpou = parse(request.getSunpou(), MSG_SUNPOU_NOT_NUMERIC);
        BigDecimal kijunMin = parse(request.getKijunMin(), MSG_KIJUN_NOT_NUMERIC);
        BigDecimal kijunMax = parse(request.getKijunMax(), MSG_KIJUN_NOT_NUMERIC);

        String hantei = judgmentService.judge(sunpou, kijunMin, kijunMax);
        long kensaId = repository.insert(
                request.getShijiNo(),
                request.getLotNo(),
                request.getKensaSha(),
                sunpou,
                kijunMin,
                kijunMax,
                hantei,
                request.getFuryoNaiyo() == null ? "" : request.getFuryoNaiyo());

        return new InspectionResponse(
                hantei,
                "検査結果を登録しました。判定は " + hantei + " です。",
                repository.findById(kensaId));
    }

    public List<KensaResult> search(String shijiNo, String hantei) {
        return repository.search(shijiNo, hantei);
    }

    public List<DefectSummary> defectSummary() {
        return repository.defectSummary();
    }

    public List<SimpleOrder> simpleOrders() {
        return repository.findSimpleOrders();
    }

    /** 現行の {@code isNumeric} 相当の検証。非数値・欠落は検証エラー。 */
    private static BigDecimal parse(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ValidationException(message);
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            throw new ValidationException(message);
        }
    }
}
