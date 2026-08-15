package com.seizo.mes.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 現行 ColdFusion 版に認証は存在しないため、本移行スコープでも認証は追加しない。
 * Angular 開発サーバからの呼び出しのみ許可する。
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200", "http://localhost:8888")
                .allowedMethods("GET", "POST");
    }
}
