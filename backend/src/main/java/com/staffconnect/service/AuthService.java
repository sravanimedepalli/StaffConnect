package com.staffconnect.service;

import com.staffconnect.dto.ChangePasswordRequest;
import com.staffconnect.dto.LoginRequest;
import com.staffconnect.dto.LoginResponse;
import com.staffconnect.entity.AuditLog;
import com.staffconnect.entity.Employee;
import com.staffconnect.entity.User;
import com.staffconnect.exception.BadRequestException;
import com.staffconnect.exception.ResourceNotFoundException;
import com.staffconnect.repository.AuditLogRepository;
import com.staffconnect.repository.EmployeeRepository;
import com.staffconnect.repository.UserRepository;
import com.staffconnect.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogRepository auditLogRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final OtpService otpService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       EmployeeRepository employeeRepository,
                       AuditLogRepository auditLogRepository,
                       JwtTokenProvider tokenProvider,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       OtpService otpService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.auditLogRepository = auditLogRepository;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.otpService = otpService;
    }

    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail().trim(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmailIgnoreCase(loginRequest.getEmail().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new BadRequestException("Your account is deactivated. Please contact HR Administrator.");
        }

        LocalDateTime previousLogin = user.getLastLogin();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String jwt = tokenProvider.generateToken(authentication, user.getRole().name());

        Optional<Employee> employeeOpt = employeeRepository.findByEmailIgnoreCase(user.getEmail());

        String employeeId = employeeOpt.map(Employee::getEmployeeId).orElse("ADM-001");
        String fullName = employeeOpt.map(Employee::getFullName).orElse(user.getRole().name().equals("ROLE_ADMIN") ? "System Administrator" : user.getEmail());
        String department = employeeOpt.map(Employee::getDepartment).orElse("Administration");
        String designation = employeeOpt.map(Employee::getDesignation).orElse(user.getRole().name().equals("ROLE_ADMIN") ? "Global Administrator" : "Staff");
        String avatarUrl = employeeOpt.map(Employee::getAvatarUrl).orElse(null);

        // Record in Audit Log
        auditLogRepository.save(new AuditLog("USER_LOGIN", "User logged in successfully: " + user.getEmail(), user.getEmail()));

        return new LoginResponse(
                jwt,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                employeeId,
                fullName,
                department,
                designation,
                avatarUrl,
                previousLogin != null ? previousLogin : LocalDateTime.now()
        );
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password cannot be the same as current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLogRepository.save(new AuditLog("PASSWORD_CHANGED", "User changed password: " + user.getEmail(), user.getEmail()));
    }

    public LoginResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<Employee> employeeOpt = employeeRepository.findByEmailIgnoreCase(user.getEmail());

        String employeeId = employeeOpt.map(Employee::getEmployeeId).orElse("ADM-001");
        String fullName = employeeOpt.map(Employee::getFullName).orElse("System Administrator");
        String department = employeeOpt.map(Employee::getDepartment).orElse("Administration");
        String designation = employeeOpt.map(Employee::getDesignation).orElse("Global Administrator");
        String avatarUrl = employeeOpt.map(Employee::getAvatarUrl).orElse(null);

        return new LoginResponse(
                null,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                employeeId,
                fullName,
                department,
                designation,
                avatarUrl,
                user.getLastLogin()
        );
    }

    /**
     * Initiates Forgot Password via Email or Phone OTP.
     */
    @Transactional
    public Map<String, Object> requestPasswordReset(String identifier) {
        String clean = identifier.trim();
        Map<String, Object> result = new HashMap<>();

        if (clean.contains("@")) {
            // Email reset flow
            User user = userRepository.findByEmailIgnoreCase(clean)
                    .orElseThrow(() -> new ResourceNotFoundException("No account registered with email: " + clean));

            String resetToken = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            user.setResetToken(resetToken);
            user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            Optional<Employee> emp = employeeRepository.findByEmailIgnoreCase(clean);
            String name = emp.map(Employee::getFullName).orElse("User");
            emailService.sendPasswordResetEmail(clean, name, resetToken);

            result.put("method", "email");
            result.put("target", clean);
            result.put("message", "Reset code dispatched to " + clean + " (valid for 15 minutes).");
            result.put("resetCode", resetToken); // Provided for immediate local testing if needed
        } else {
            // Phone reset flow
            String normPhone = OtpService.normalizePhone(clean);
            Employee emp = employeeRepository.findAll().stream()
                    .filter(e -> e.getPhone() != null && OtpService.normalizePhone(e.getPhone()).equals(normPhone))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No employee profile found with phone: " + clean));

            Map<String, Object> otpRes = otpService.sendOtp(emp.getPhone());
            result.put("method", "phone");
            result.put("target", emp.getPhone());
            result.put("email", emp.getEmail());
            result.put("message", otpRes.get("message"));
            if (otpRes.containsKey("devOtp")) {
                result.put("devOtp", otpRes.get("devOtp"));
            }
        }

        return result;
    }

    /**
     * Verifies reset code/OTP and sets the new password.
     */
    @Transactional
    public void resetPassword(String identifier, String code, String newPassword) {
        String clean = identifier.trim();
        User user;

        if (clean.contains("@")) {
            user = userRepository.findByEmailIgnoreCase(clean)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found."));

            if (user.getResetToken() == null || !user.getResetToken().equalsIgnoreCase(code.trim())) {
                throw new BadRequestException("Invalid reset code or token.");
            }
            if (user.getResetTokenExpiry() != null && LocalDateTime.now().isAfter(user.getResetTokenExpiry())) {
                throw new BadRequestException("Reset code has expired. Please request a new one.");
            }
        } else {
            String normPhone = OtpService.normalizePhone(clean);
            boolean verified = otpService.verifyOtp(normPhone, code);
            if (!verified) {
                throw new BadRequestException("Invalid or expired OTP code.");
            }

            Employee emp = employeeRepository.findAll().stream()
                    .filter(e -> e.getPhone() != null && OtpService.normalizePhone(e.getPhone()).equals(normPhone))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No employee found with this phone number."));

            user = emp.getUser();
            if (user == null) {
                user = userRepository.findByEmailIgnoreCase(emp.getEmail())
                        .orElseThrow(() -> new ResourceNotFoundException("User account not found."));
            }
        }

        if (newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters long.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setActive(true);
        userRepository.save(user);

        auditLogRepository.save(new AuditLog("PASSWORD_RESET", "Password was reset for user: " + user.getEmail(), user.getEmail()));
    }

    /**
     * Activates a newly created employee account and sets their permanent password.
     */
    @Transactional
    public void setupPassword(String email, String token, String newPassword) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.getResetToken() == null || !user.getResetToken().equals(token.trim())) {
            throw new BadRequestException("Invalid or expired activation link.");
        }

        if (user.getResetTokenExpiry() != null && LocalDateTime.now().isAfter(user.getResetTokenExpiry())) {
            throw new BadRequestException("Activation link has expired. Please request HR to re-issue credentials.");
        }

        if (newPassword.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setActive(true);
        userRepository.save(user);

        auditLogRepository.save(new AuditLog("ACCOUNT_ACTIVATED", "Account activated and password configured: " + email, email));
    }
}
