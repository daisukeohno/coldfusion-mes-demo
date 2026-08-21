package jp.co.seizo.mes.inspection;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jp.co.seizo.mes.inspection.dto.DefectSummary;
import jp.co.seizo.mes.inspection.dto.InspectionRecord;
import jp.co.seizo.mes.inspection.dto.InspectionRequest;
import jp.co.seizo.mes.inspection.dto.InspectionResponse;
import jp.co.seizo.mes.inspection.dto.OrderOption;

@RestController
@RequestMapping("/api")
public class InspectionController {

	private final InspectionService inspectionService;

	public InspectionController(InspectionService inspectionService) {
		this.inspectionService = inspectionService;
	}

	@GetMapping("/inspections")
	public List<InspectionRecord> inspections(
			@RequestParam(name = "shiji_no", required = false) String shijiNo,
			@RequestParam(name = "hantei", required = false) String hantei) {
		return inspectionService.findInspections(shijiNo, hantei);
	}

	@GetMapping("/inspections/defect-summary")
	public List<DefectSummary> defectSummary() {
		return inspectionService.findDefectSummary();
	}

	@GetMapping("/orders/for-inspection")
	public List<OrderOption> ordersForInspection() {
		return inspectionService.findOrdersForInspection();
	}

	@PostMapping("/inspections")
	public InspectionResponse register(@RequestBody InspectionRequest request) {
		return inspectionService.register(request);
	}

	@ExceptionHandler(InspectionValidationException.class)
	public ResponseEntity<InspectionResponse> handleValidation(InspectionValidationException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(InspectionResponse.error(ex.getMessage()));
	}
}
