package com.peery.app.dto;

/** Query projection: a comment and who it is ABOUT. The author is never selected. */
public record CommentRow(Long evaluateeId, String comment) {
}