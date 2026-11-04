package com.peery.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class ClockConfig {

    /** One UTC clock for every deadline check, so tests can swap it for a fixed clock. */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}