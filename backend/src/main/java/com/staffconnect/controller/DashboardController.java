package com.staffconnect.controller;

import com.staffconnect.dto.ApiResponse;
import com.staffconnect.dto.DashboardStatsDto;
import com.staffconnect.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getStats() {
        DashboardStatsDto stats = dashboardService.getAdminStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/employee")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEmployeeDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> data = dashboardService.getEmployeeDashboardInfo(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
