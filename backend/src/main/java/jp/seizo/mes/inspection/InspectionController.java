package jp.seizo.mes.inspection;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {

	private final InspectionRegistrationService registrationService;

	private final InspectionRepository repository;

	public InspectionController(InspectionRegistrationService registrationService, InspectionRepository repository) {
		this.registrationService = registrationService;
		this.repository = repository;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public InspectionCreatedResponse register(@Valid @RequestBody InspectionRequest request) {
		return registrationService.register(request);
	}

	@GetMapping
	public List<InspectionRecord> list(@RequestParam(name = "shiji_no", required = false) String shijiNo,
			@RequestParam(name = "hantei", required = false) String hantei) {
		return repository.findAll(shijiNo, hantei);
	}

	@GetMapping("/defect-summary")
	public List<DefectSummary> defectSummary() {
		return repository.summarizeDefects();
	}

}
