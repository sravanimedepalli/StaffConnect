package com.staffconnect.controller;

import com.staffconnect.dto.ApiResponse;
import com.staffconnect.dto.EmployeeDto;
import com.staffconnect.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeDto>>> getAllEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status) {
        List<EmployeeDto> employees = employeeService.getAllEmployees(search, department, status);
        return ResponseEntity.ok(ApiResponse.ok(employees));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDto>> getEmployeeById(@PathVariable Long id) {
        EmployeeDto employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponse.ok(employee));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeDto>> createEmployee(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EmployeeDto dto) {
        EmployeeDto created = employeeService.createEmployee(dto, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Employee registered successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateEmployee(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDto dto) {
        EmployeeDto updated = employeeService.updateEmployee(id, dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Employee updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> statusMap) {
        String status = statusMap.get("status");
        EmployeeDto updated = employeeService.updateStatus(id, status, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Employee status updated to " + status, updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteEmployee(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        employeeService.deleteEmployee(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Employee removed successfully", "DELETED"));
    }
}
