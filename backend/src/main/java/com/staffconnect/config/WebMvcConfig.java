package com.staffconnect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/avatars}")
    private String uploadSubdir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadSubdir).toAbsolutePath().normalize();
        String uploadUri = uploadPath.toUri().toString();

        // Serve static avatars from filesystem under /uploads/avatars/**
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations(uploadUri.endsWith("/") ? uploadUri : uploadUri + "/");

        // General uploads handler
        Path generalUploadPath = Paths.get("uploads").toAbsolutePath().normalize();
        String generalUri = generalUploadPath.toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(generalUri.endsWith("/") ? generalUri : generalUri + "/");
    }
}
