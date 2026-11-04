package com.peery.app.service;

import com.peery.app.dto.EvaluationState;
import com.peery.app.entity.ProjectEntity;
import com.peery.app.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;

/** The single place that decides whether evaluations may be created or edited. */
@Component
public class EvaluationWindowPolicy {

    private final Clock clock;

    public EvaluationWindowPolicy(Clock clock) {
        this.clock = clock;
    }

    public Instant now() {
        return clock.instant();
    }

    /** The end instant is inclusive. */
    public EvaluationState stateOf(ProjectEntity project) {
        Instant now = clock.instant();
        if (now.isBefore(project.getEvalStartDate())) {
            return EvaluationState.NOT_OPEN;
        }
        if (now.isAfter(project.getEvalEndDate())) {
            return EvaluationState.CLOSED;
        }
        return EvaluationState.OPEN;
    }

    public void assertOpen(ProjectEntity project) {
        EvaluationState state = stateOf(project);
        if (state == EvaluationState.NOT_OPEN) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "EVALUATION_NOT_OPEN",
                    "Evaluations for this project open on " + project.getEvalStartDate());
        }
        if (state == EvaluationState.CLOSED) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "EVALUATION_WINDOW_CLOSED",
                    "Evaluations for this project closed on " + project.getEvalEndDate());
        }
    }
}