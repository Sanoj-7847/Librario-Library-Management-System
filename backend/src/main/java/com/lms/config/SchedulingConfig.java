package com.lms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ✅ Configuration to enable Spring Scheduling
 * This enables @Scheduled annotations throughout the application
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
    // Scheduling is now enabled for the application
    // All @Scheduled methods will run according to their cron expressions
}