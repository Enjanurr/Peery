package com.peery.app.service;

import com.peery.app.entity.CriterionEntity;
import com.peery.app.repository.CriterionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CriterionService {

    private record DefaultCriterion(String name, String description) {
    }

    private static final List<DefaultCriterion> DEFAULTS = List.of(
            new DefaultCriterion("Contribution", "Quality and quantity of work delivered"),
            new DefaultCriterion("Reliability", "Meets deadlines and commitments"),
            new DefaultCriterion("Communication", "Keeps the team informed and responds promptly"),
            new DefaultCriterion("Collaboration", "Works constructively with teammates"));

    private final CriterionRepository criterionRepository;

    public CriterionService(CriterionRepository criterionRepository) {
        this.criterionRepository = criterionRepository;
    }

    /**
     * Returns the project's rubric, seeding the defaults on first use.
     * Must run in a read-write transaction because it may insert.
     */
    @Transactional
    public List<CriterionEntity> getOrSeed(Long projectId) {
        if (!criterionRepository.existsByProjectId(projectId)) {
            for (int i = 0; i < DEFAULTS.size(); i++) {
                DefaultCriterion criterion = DEFAULTS.get(i);
                criterionRepository.insertIfAbsent(projectId, criterion.name(), criterion.description(), i + 1);
            }
        }
        return criterionRepository.findByProjectIdOrderByDisplayOrderAscIdAsc(projectId);
    }
}