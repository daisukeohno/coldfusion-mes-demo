package jp.seizo.mes.inspection;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductionOrderController {

	private final InspectionRepository repository;

	public ProductionOrderController(InspectionRepository repository) {
		this.repository = repository;
	}

	@GetMapping("/api/production-orders")
	public List<ProductionOrderOption> list() {
		return repository.findProductionOrders();
	}

}
