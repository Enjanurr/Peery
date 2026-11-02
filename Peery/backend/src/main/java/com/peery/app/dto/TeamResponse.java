package com.peery.app.dto;

import java.util.List;

public record TeamResponse(Long id, String name, List<StudentSummaryResponse> members) {
}