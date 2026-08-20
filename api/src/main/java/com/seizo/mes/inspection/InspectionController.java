package com.seizo.mes.inspection;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 品質検査画面 (app/inspection.cfm) 相当の REST エンドポイント。判定分岐は持たない。 */
@RestController
@RequestMapping("/api")
public class InspectionController {

    private final InspectionService inspectionService;

    public InspectionController(InspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    /** 検査結果の登録。判定結果を返す。 */
    @PostMapping("/inspections")
    public InspectionResponse register(@RequestBody InspectionRequest request) {
        return inspectionService.register(request);
    }

    /** 検査履歴の一覧。shiji_no / hantei で絞込。 */
    @GetMapping("/inspections")
    public List<KensaResult> search(
            @RequestParam(name = "shiji_no", required = false) String shijiNo,
            @RequestParam(name = "hantei", required = false) String hantei) {
        return inspectionService.search(shijiNo, hantei);
    }

    /** 不良内容集計。 */
    @GetMapping("/inspections/defect-summary")
    public List<DefectSummary> defectSummary() {
        return inspectionService.defectSummary();
    }

    /** 製造指示プルダウン用一覧。 */
    @GetMapping("/orders/for-inspection")
    public List<OrderForInspection> ordersForInspection() {
        return inspectionService.ordersForInspection();
    }
}
