package com.seizo.mes.inspection;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 品質検査画面 (app/inspection.cfm) 相当の REST エンドポイント。 */
@RestController
@RequestMapping("/api")
public class InspectionController {

    private final InspectionService inspectionService;

    public InspectionController(InspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    @PostMapping("/inspections")
    public InspectionResponse register(@RequestBody InspectionRequest request) {
        return inspectionService.register(request);
    }

    @GetMapping("/inspections")
    public List<KensaResult> search(
            @RequestParam(name = "shijiNo", required = false) String shijiNo,
            @RequestParam(name = "hantei", required = false) String hantei) {
        return inspectionService.search(shijiNo, hantei);
    }

    @GetMapping("/inspections/defect-summary")
    public List<DefectSummary> defectSummary() {
        return inspectionService.defectSummary();
    }

    @GetMapping("/orders/simple")
    public List<SimpleOrder> simpleOrders() {
        return inspectionService.simpleOrders();
    }
}
