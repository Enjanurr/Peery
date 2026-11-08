package com.peery.app.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * DEVELOPMENT ONLY: prints the link to the backend console so you can test without an email server.
 * Disabled under the "prod" profile, where the app will refuse to start until a real sender exists.
 */
@Component
@Profile("!prod")
public class LoggingResetLinkSender implements ResetLinkSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingResetLinkSender.class);

    @Override
    public void send(String toEmail, String fullName, String link, long ttlMinutes) {
        log.info("PASSWORD RESET LINK for {} (valid {} min): {}", toEmail, ttlMinutes, link);
    }
}