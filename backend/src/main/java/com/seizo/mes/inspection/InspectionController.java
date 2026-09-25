package com.seizo.mes.inspection;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InspectionController {

    private final InspectionService service;

    public InspectionController(InspectionService service) {
        this.service = service;
    }

    @PostMapping("/inspections")
    @ResponseStatus(HttpStatus.CREATED)
    public InspectionRecord register(@Valid @RequestBody InspectionRequest request) {
        return service.register(request);
    }

    @GetMapping("/inspections")
    public List<InspectionRecord> list(
            @RequestParam(name = "shiji_no", required = false) String shijiNo,
            @RequestParam(name = "hantei", required = false) String hantei) {
        Hantei filter = null;
        if (hantei != null && !hantei.isEmpty()) {
            try {
                filter = Hantei.fromLabel(hantei);
            } catch (IllegalArgumentException e) {
                throw new ValidationException("hantei", "判定は OK / NG / 再検査 のいずれかを指定してください。");
            }
        }
        return service.list(shijiNo, filter);
    }

    @GetMapping("/inspections/defect-summary")
    public List<DefectSummary> defectSummary() {
        return service.defectSummary();
    }

    @GetMapping("/orders")
    public List<OrderOption> orders() {
        return service.orderOptions();
    }
}
