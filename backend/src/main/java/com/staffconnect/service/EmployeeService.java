package com.staffconnect.service;

import com.staffconnect.dto.EmployeeDto;
import com.staffconnect.dto.ProfileUpdateRequest;
import com.staffconnect.entity.AuditLog;
import com.staffconnect.entity.Employee;
import com.staffconnect.entity.Role;
import com.staffconnect.entity.User;
import com.staffconnect.exception.BadRequestException;
import com.staffconnect.exception.ResourceNotFoundException;
import com.staffconnect.repository.AuditLogRepository;
import com.staffconnect.repository.EmployeeRepository;
import com.staffconnect.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           UserRepository userRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder,
                           EmailService emailService) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public List<EmployeeDto> getAllEmployees(String search, String department, String status) {
        List<Employee> employees = employeeRepository.searchEmployees(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                (department != null && !department.trim().isEmpty()) ? department.trim() : null,
                (status != null && !status.trim().isEmpty()) ? status.trim() : null
        );
        return employees.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return mapToDto(employee);
    }

    public EmployeeDto getEmployeeByEmail(String email) {
        Employee employee = employeeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));
        return mapToDto(employee);
    }

    @Transactional
    public EmployeeDto createEmployee(EmployeeDto dto, String adminEmail) {
        String cleanEmail = dto.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(cleanEmail) || employeeRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new BadRequestException("An employee or user with email '" + cleanEmail + "' already exists");
        }

        // Generate Employee ID if not supplied
        String employeeId = dto.getEmployeeId();
        if (employeeId == null || employeeId.trim().isEmpty()) {
            long count = employeeRepository.count() + 1001;
            employeeId = "EMP-" + count;
        }

        if (employeeRepository.existsByEmployeeIdIgnoreCase(employeeId)) {
            employeeId = "EMP-" + (System.currentTimeMillis() % 100000);
        }

        String initialPassword = dto.getInitialPassword();
        if (initialPassword == null || initialPassword.trim().isEmpty()) {
            initialPassword = "Staff@" + (1000 + (int)(Math.random() * 9000));
        }

        Role userRole = Role.ROLE_EMPLOYEE;
        if (dto.getRole() != null && dto.getRole().toUpperCase().contains("ADMIN")) {
            userRole = Role.ROLE_ADMIN;
        }

        String activationToken = java.util.UUID.randomUUID().toString();
        User user = new User(cleanEmail, passwordEncoder.encode(initialPassword), userRole);
        user.setActive(true);
        user.setResetToken(activationToken);
        user.setResetTokenExpiry(java.time.LocalDateTime.now().plusDays(1));

        Employee employee = new Employee();
        employee.setEmployeeId(employeeId);
        employee.setFirstName(dto.getFirstName().trim());
        employee.setLastName(dto.getLastName().trim());
        employee.setEmail(cleanEmail);
        employee.setPhone(dto.getPhone());
        employee.setDob(dto.getDob());
        employee.setGender(dto.getGender());
        employee.setPhoneVerified(Boolean.TRUE.equals(dto.getPhoneVerified()));
        employee.setDepartment(dto.getDepartment());
        employee.setDesignation(dto.getDesignation());
        employee.setSalary(dto.getSalary() != null ? dto.getSalary() : 0.0);
        employee.setJoiningDate(dto.getJoiningDate() != null ? dto.getJoiningDate() : LocalDate.now());
        employee.setAddress(dto.getAddress());
        employee.setBio(dto.getBio());
        employee.setSkills(dto.getSkills());
        employee.setAvatarUrl(dto.getAvatarUrl());
        employee.setStatus(dto.getStatus() != null ? dto.getStatus().toUpperCase() : "ACTIVE");
        employee.setUser(user);

        Employee saved = employeeRepository.save(employee);

        // Audit Log
        auditLogRepository.save(new AuditLog("CREATE_EMPLOYEE",
                "Created employee: " + saved.getFullName() + " (" + saved.getEmployeeId() + ")",
                adminEmail));

        // Send welcome email via SMTP / mock fallback with activation link
        String emailStatus = emailService.sendWelcomeEmail(cleanEmail, saved.getFullName(), saved.getEmployeeId(), activationToken);

        EmployeeDto responseDto = mapToDto(saved);
        responseDto.setInitialPassword(initialPassword); // Return temporary password for immediate Admin display
        responseDto.setEmailDeliveryStatus(emailStatus);
        return responseDto;
    }

    @Transactional
    public EmployeeDto updateEmployee(Long id, EmployeeDto dto, String adminEmail) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        employee.setFirstName(dto.getFirstName().trim());
        employee.setLastName(dto.getLastName().trim());
        employee.setPhone(dto.getPhone());
        if (dto.getDob() != null) employee.setDob(dto.getDob());
        if (dto.getGender() != null) employee.setGender(dto.getGender());
        if (dto.getPhoneVerified() != null) employee.setPhoneVerified(dto.getPhoneVerified());
        employee.setDepartment(dto.getDepartment());
        employee.setDesignation(dto.getDesignation());
        if (dto.getSalary() != null) {
            employee.setSalary(dto.getSalary());
        }
        if (dto.getJoiningDate() != null) {
            employee.setJoiningDate(dto.getJoiningDate());
        }
        employee.setAddress(dto.getAddress());
        employee.setBio(dto.getBio());
        employee.setSkills(dto.getSkills());
        if (dto.getAvatarUrl() != null && !dto.getAvatarUrl().trim().isEmpty()) {
            employee.setAvatarUrl(dto.getAvatarUrl());
        }
        if (dto.getStatus() != null) {
            employee.setStatus(dto.getStatus().toUpperCase());
            if (employee.getUser() != null) {
                employee.getUser().setActive(!"INACTIVE".equalsIgnoreCase(dto.getStatus()));
            }
        }

        if (dto.getRole() != null && employee.getUser() != null) {
            Role newRole = dto.getRole().toUpperCase().contains("ADMIN") ? Role.ROLE_ADMIN : Role.ROLE_EMPLOYEE;
            employee.getUser().setRole(newRole);
        }

        Employee updated = employeeRepository.save(employee);

        auditLogRepository.save(new AuditLog("UPDATE_EMPLOYEE",
                "Updated employee details for: " + updated.getFullName() + " (" + updated.getEmployeeId() + ")",
                adminEmail));

        return mapToDto(updated);
    }

    @Transactional
    public EmployeeDto updateStatus(Long id, String status, String adminEmail) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        String upperStatus = status.trim().toUpperCase();
        employee.setStatus(upperStatus);
        if (employee.getUser() != null) {
            employee.getUser().setActive(!"INACTIVE".equalsIgnoreCase(upperStatus));
        }

        Employee updated = employeeRepository.save(employee);

        auditLogRepository.save(new AuditLog("STATUS_CHANGE",
                "Changed status of " + updated.getFullName() + " to " + upperStatus,
                adminEmail));

        return mapToDto(updated);
    }

    @Transactional
    public void deleteEmployee(Long id, String adminEmail) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        String info = employee.getFullName() + " (" + employee.getEmployeeId() + ")";
        employeeRepository.delete(employee);

        auditLogRepository.save(new AuditLog("DELETE_EMPLOYEE", "Deleted employee: " + info, adminEmail));
    }

    @Transactional
    public EmployeeDto updateSelfProfile(String email, ProfileUpdateRequest req) {
        Employee employee = employeeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));

        if (req.getPhone() != null) employee.setPhone(req.getPhone().trim());
        if (req.getAddress() != null) employee.setAddress(req.getAddress().trim());
        if (req.getBio() != null) employee.setBio(req.getBio().trim());
        if (req.getSkills() != null) employee.setSkills(req.getSkills().trim());
        if (req.getDob() != null) employee.setDob(req.getDob());
        if (req.getGender() != null) employee.setGender(req.getGender().trim());
        if (req.getAvatarUrl() != null && !req.getAvatarUrl().trim().isEmpty()) {
            employee.setAvatarUrl(req.getAvatarUrl().trim());
        }

        Employee updated = employeeRepository.save(employee);
        auditLogRepository.save(new AuditLog("PROFILE_UPDATE", "Employee updated personal profile: " + email, email));

        return mapToDto(updated);
    }

    public EmployeeDto mapToDto(Employee employee) {
        EmployeeDto dto = new EmployeeDto();
        dto.setId(employee.getId());
        dto.setEmployeeId(employee.getEmployeeId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setEmail(employee.getEmail());
        dto.setPhone(employee.getPhone());
        dto.setDepartment(employee.getDepartment());
        dto.setDesignation(employee.getDesignation());
        dto.setSalary(employee.getSalary());
        dto.setJoiningDate(employee.getJoiningDate());
        dto.setDob(employee.getDob());
        dto.setGender(employee.getGender());
        dto.setPhoneVerified(employee.isPhoneVerified());
        dto.setAddress(employee.getAddress());
        dto.setBio(employee.getBio());
        dto.setSkills(employee.getSkills());
        dto.setAvatarUrl(employee.getAvatarUrl());
        dto.setStatus(employee.getStatus());

        if (employee.getUser() != null) {
            dto.setRole(employee.getUser().getRole().name());
            dto.setLastLogin(employee.getUser().getLastLogin());
        } else {
            dto.setRole("ROLE_EMPLOYEE");
        }

        return dto;
    }
}
