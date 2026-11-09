package com.staffconnect.dto;

import java.time.LocalDateTime;

public class LoginResponse {
    private String token;
    private String tokenType = "Bearer";
    private Long id;
    private String email;
    private String role;
    private String employeeId;
    private String fullName;
    private String department;
    private String designation;
    private String avatarUrl;
    private LocalDateTime lastLogin;

    public LoginResponse() {
    }

    public LoginResponse(String token, Long id, String email, String role, String employeeId,
                         String fullName, String department, String designation, String avatarUrl, LocalDateTime lastLogin) {
        this.token = token;
        this.tokenType = "Bearer";
        this.id = id;
        this.email = email;
        this.role = role;
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.department = department;
        this.designation = designation;
        this.avatarUrl = avatarUrl;
        this.lastLogin = lastLogin;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }
}
