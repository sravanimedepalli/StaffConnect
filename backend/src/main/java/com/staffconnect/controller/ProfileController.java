package com.staffconnect.controller;

import com.staffconnect.dto.ApiResponse;
import com.staffconnect.dto.EmployeeDto;
import com.staffconnect.dto.ProfileUpdateRequest;
import com.staffconnect.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final EmployeeService employeeService;

    public ProfileController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<EmployeeDto>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        EmployeeDto employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(employee));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<EmployeeDto>> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ProfileUpdateRequest request) {
        EmployeeDto updated = employeeService.updateSelfProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }
}
