package com.staffconnect.controller;

import com.staffconnect.dto.ApiResponse;
import com.staffconnect.dto.ChangePasswordRequest;
import com.staffconnect.dto.LoginRequest;
import com.staffconnect.dto.LoginResponse;
import com.staffconnect.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", "OK"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        LoginResponse response = authService.getCurrentUserProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPassword(@RequestBody Map<String, String> payload) {
        String identifier = payload.get("identifier");
        if (identifier == null || identifier.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Please provide email address or phone number."));
        }
        Map<String, Object> result = authService.requestPasswordReset(identifier);
        return ResponseEntity.ok(ApiResponse.ok("Reset instructions dispatched", result));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody Map<String, String> payload) {
        String identifier = payload.get("identifier");
        String code = payload.get("code");
        String newPassword = payload.get("newPassword");

        if (identifier == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Identifier, verification code, and new password are required."));
        }

        authService.resetPassword(identifier, code, newPassword);
        return ResponseEntity.ok(ApiResponse.ok("Password has been reset successfully. Please login with your new credentials.", "OK"));
    }

    @PostMapping("/setup-password")
    public ResponseEntity<ApiResponse<String>> setupPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");

        if (email == null || token == null || newPassword == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email, activation token, and new password are required."));
        }

        authService.setupPassword(email, token, newPassword);
        return ResponseEntity.ok(ApiResponse.ok("Account activated successfully! You may now sign in.", "OK"));
    }
}
