package com.seizo.mes.inspection;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionService {

    private final InspectionRepository repository;
    private final InspectionJudgmentService judgment;
    private final Clock clock;

    public InspectionService(InspectionRepository repository, InspectionJudgmentService judgment, Clock clock) {
        this.repository = repository;
        this.judgment = judgment;
        this.clock = clock;
    }

    @Transactional
    public InspectionRecord register(InspectionRequest req) {
        if (!repository.orderExists(req.shijiNo())) {
            throw new ValidationException("shiji_no", "製造指示 " + req.shijiNo() + " は存在しません。");
        }
        Hantei hantei = judgment.judge(req.sunpou(), req.kijunMin(), req.kijunMax());
        long id = repository.insert(req, LocalDate.now(clock), hantei);
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<InspectionRecord> list(String shijiNo, Hantei hantei) {
        return repository.findAll(shijiNo, hantei);
    }

    @Transactional(readOnly = true)
    public List<DefectSummary> defectSummary() {
        return repository.defectSummary();
    }

    @Transactional(readOnly = true)
    public List<OrderOption> orderOptions() {
        return repository.orderOptions();
    }
}
