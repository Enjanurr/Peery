package com.peery.app.dto;

import java.util.List;

public record StudentTeamResponse(Long id, String name, List<StudentSummaryResponse> teammates) {
}