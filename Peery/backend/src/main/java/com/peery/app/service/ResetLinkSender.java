package com.peery.app.service;

/** Delivers a password-reset link. The default implementation only logs it (development). */
public interface ResetLinkSender {

    void send(String toEmail, String fullName, String link, long ttlMinutes);
}