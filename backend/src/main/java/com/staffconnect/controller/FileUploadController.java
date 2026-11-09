package com.staffconnect.controller;

import com.staffconnect.dto.ApiResponse;
import com.staffconnect.service.FileUploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String avatarUrl = fileUploadService.saveAvatar(file);
        return ResponseEntity.ok(ApiResponse.ok("Avatar uploaded successfully", Map.of("url", avatarUrl)));
    }
}
