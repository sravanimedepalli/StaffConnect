package com.staffconnect.controller;

import com.staffconnect.dto.ApiResponse;
import com.staffconnect.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.get("phone");
        if (phone == null || phone.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phone number is required."));
        }

        Map<String, Object> result = otpService.sendOtp(phone);
        boolean success = Boolean.TRUE.equals(result.get("success"));
        String message = (String) result.getOrDefault("message", "OTP processed");

        return ResponseEntity.ok(new ApiResponse<>(success, message, result));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> verifyOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.get("phone");
        String otp = payload.get("otp");

        if (phone == null || otp == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phone and OTP are required."));
        }

        boolean isValid = otpService.verifyOtp(phone, otp);
        if (isValid) {
            return ResponseEntity.ok(ApiResponse.ok("Phone number verified successfully!", Map.of("verified", true)));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired OTP code."));
        }
    }
}
