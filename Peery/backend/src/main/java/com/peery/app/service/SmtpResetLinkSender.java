package com.peery.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class SmtpResetLinkSender implements ResetLinkSender {

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpResetLinkSender(JavaMailSender mailSender, @Value("${peery.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void send(String toEmail, String fullName, String link, long ttlMinutes) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(toEmail);
        message.setSubject("Reset your Peery password");
        message.setText("Hi " + fullName + ",\n\nUse this link to choose a new password. It works once and expires in "
                + ttlMinutes + " minutes:\n\n" + link
                + "\n\nIf you did not ask for this, ignore this email; your password has not changed.");
        mailSender.send(message);
    }
}