package com.mirusystems.be.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AisStreamConfig.AisStreamProperties.class)
public class AisStreamConfig {

    @ConfigurationProperties(prefix = "aisstream")
    public record AisStreamProperties(String apiKey, String wsUrl) {}
}