package com.staffconnect.config;

import com.staffconnect.entity.AuditLog;
import com.staffconnect.entity.Department;
import com.staffconnect.entity.Employee;
import com.staffconnect.entity.Role;
import com.staffconnect.entity.User;
import com.staffconnect.repository.AuditLogRepository;
import com.staffconnect.repository.DepartmentRepository;
import com.staffconnect.repository.EmployeeRepository;
import com.staffconnect.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (departmentRepository.count() == 0) {
            logger.info("Seeding initial departments...");
            seedDepartments();
        }

        if (userRepository.count() == 0) {
            logger.info("Seeding admin and sample workforce directory...");
            seedUsersAndEmployees();
        }

        logger.info("StaffConnect Database initialization complete.");
    }

    private void seedDepartments() {
        departmentRepository.save(new Department("Engineering", "ENG", "Core software development, cloud infrastructure, and QA", "Alex Morgan", "Building A - Floor 4", 1250000.0));
        departmentRepository.save(new Department("Human Resources", "HR", "Talent acquisition, employee welfare, and onboarding", "Marcus Johnson", "Building B - Floor 2", 350000.0));
        departmentRepository.save(new Department("Product & Design", "PRD", "Product discovery, user research, and UI/UX design", "Elena Rostova", "Building A - Floor 3", 550000.0));
        departmentRepository.save(new Department("Marketing", "MKT", "Brand management, content growth, and digital outreach", "David Kim", "Building B - Floor 3", 650000.0));
        departmentRepository.save(new Department("Finance", "FIN", "Corporate accounting, financial planning, and audits", "Priya Patel", "Building B - Floor 1", 420000.0));
        departmentRepository.save(new Department("Sales", "SLS", "Global customer acquisition and enterprise partnerships", "Ananya Sharma", "Building C - Floor 2", 890000.0));
    }

    private void seedUsersAndEmployees() {
        // 1. Super Admin
        User adminUser = new User("admin@staffconnect.com", passwordEncoder.encode("Admin@123"), Role.ROLE_ADMIN);
        adminUser.setLastLogin(LocalDateTime.now().minusHours(2));

        Employee adminEmployee = new Employee(
                "ADM-1001",
                "Alex",
                "Morgan",
                "admin@staffconnect.com",
                "+1 (555) 019-2834",
                "Engineering",
                "Chief Technology Officer & Admin",
                165000.0,
                LocalDate.of(2021, 3, 15),
                adminUser
        );
        adminEmployee.setAddress("450 Tech Plaza, Suite 900, San Francisco, CA");
        adminEmployee.setBio("Enterprise architect and technology strategist leading engineering initiatives and platform reliability.");
        adminEmployee.setSkills("Java, Spring Boot, Microservices, Cloud Architecture, System Security");
        adminEmployee.setAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80");
        adminEmployee.setStatus("ACTIVE");
        adminEmployee.setDob(LocalDate.of(1988, 5, 14));
        adminEmployee.setGender("Female");
        adminEmployee.setPhoneVerified(true);
        employeeRepository.save(adminEmployee);

        // 2. Sarah Chen - Senior Backend Engineer
        createEmployee(
                "EMP-1002", "Sarah", "Chen", "sarah.chen@staffconnect.com", "+1 (555) 014-9982",
                "Engineering", "Senior Backend Engineer", 125000.0, LocalDate.of(2022, 6, 1),
                "Java, Spring Cloud, Kafka, PostgreSQL, Docker",
                "Staff@123", Role.ROLE_EMPLOYEE, "ACTIVE",
                "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80",
                "Passionate about building scalable distributed backends and event-driven architectures."
        );

        // 3. Marcus Johnson - People Operations Lead
        createEmployee(
                "EMP-1003", "Marcus", "Johnson", "marcus.johnson@staffconnect.com", "+1 (555) 012-3456",
                "Human Resources", "People Operations Lead", 98000.0, LocalDate.of(2022, 1, 10),
                "Talent Management, HR Analytics, Culture, Employee Relations",
                "Staff@123", Role.ROLE_EMPLOYEE, "ACTIVE",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
                "Dedicated to fostering inclusive, high-performance workplace cultures and employee growth."
        );

        // 4. Elena Rostova - Lead UI/UX Designer
        createEmployee(
                "EMP-1004", "Elena", "Rostova", "elena.rostova@staffconnect.com", "+1 (555) 017-7711",
                "Product & Design", "Lead UI/UX Designer", 112000.0, LocalDate.of(2023, 2, 20),
                "Figma, Design Systems, User Research, Prototyping, Accessibility",
                "Staff@123", Role.ROLE_EMPLOYEE, "ACTIVE",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80",
                "Obsessed with crafting delightful user experiences and clean minimalist SaaS design systems."
        );

        // 5. David Kim - Growth Marketing Director
        createEmployee(
                "EMP-1005", "David", "Kim", "david.kim@staffconnect.com", "+1 (555) 018-8822",
                "Marketing", "Growth Marketing Director", 118000.0, LocalDate.of(2023, 5, 12),
                "Digital Marketing, SEO/SEM, Funnel Optimization, Brand Strategy",
                "Staff@123", Role.ROLE_EMPLOYEE, "ACTIVE",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
                "Driving sustainable top-of-funnel customer acquisition and data-backed marketing experiments."
        );

        // 6. Priya Patel - Senior Financial Analyst
        createEmployee(
                "EMP-1006", "Priya", "Patel", "priya.patel@staffconnect.com", "+1 (555) 013-4455",
                "Finance", "Senior Financial Analyst", 105000.0, LocalDate.of(2023, 8, 1),
                "Financial Modeling, Budgeting, Forecasting, Corporate Audit",
                "Staff@123", Role.ROLE_EMPLOYEE, "ACTIVE",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80",
                "Specialized in corporate financial forecasting, resource allocation, and cash-flow intelligence."
        );

        // 7. James Wilson - Cloud & DevOps Architect
        createEmployee(
                "EMP-1007", "James", "Wilson", "james.wilson@staffconnect.com", "+1 (555) 019-9944",
                "Engineering", "Cloud & DevOps Architect", 132000.0, LocalDate.of(2024, 1, 15),
                "Kubernetes, Terraform, AWS, CI/CD, Observability",
                "Staff@123", Role.ROLE_EMPLOYEE, "ACTIVE",
                "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80",
                "Automating multi-region cloud infrastructures and guaranteeing 99.99% system uptime."
        );

        // 8. Ananya Sharma - Enterprise Account Executive
        createEmployee(
                "EMP-1008", "Ananya", "Sharma", "ananya.sharma@staffconnect.com", "+1 (555) 011-2233",
                "Sales", "Enterprise Account Executive", 110000.0, LocalDate.of(2024, 4, 10),
                "Enterprise B2B Sales, Contract Negotiation, CRM, Solution Selling",
                "Staff@123", Role.ROLE_EMPLOYEE, "ON_LEAVE",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80",
                "Helping enterprise clients transform workforce productivity through modern software adoption."
        );

        // 9. Lucas Silva - Full Stack Developer
        createEmployee(
                "EMP-1009", "Lucas", "Silva", "lucas.silva@staffconnect.com", "+1 (555) 016-6677",
                "Engineering", "Full Stack Developer", 95000.0, LocalDate.of(2024, 8, 20),
                "Java, Spring Boot, JavaScript, HTML5/CSS3, REST APIs",
                "Staff@123", Role.ROLE_EMPLOYEE, "ACTIVE",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80",
                "Enthusiastic full-stack engineer who loves clean code, fast APIs, and responsive web experiences."
        );

        // Initial Audit Log entries
        auditLogRepository.save(new AuditLog("SYSTEM_INIT", "System initialized with base organizational structure", "SYSTEM"));
        auditLogRepository.save(new AuditLog("SEED_WORKFORCE", "Seeded executive staff and initial employee directory", "admin@staffconnect.com"));
    }

    private void createEmployee(String empId, String firstName, String lastName, String email,
                                String phone, String department, String designation, Double salary,
                                LocalDate joinDate, String skills, String password, Role role,
                                String status, String avatarUrl, String bio) {
        User user = new User(email, passwordEncoder.encode(password), role);
        user.setActive(!"INACTIVE".equalsIgnoreCase(status));
        user.setLastLogin(LocalDateTime.now().minusDays((long) (Math.random() * 5 + 1)));

        Employee employee = new Employee(empId, firstName, lastName, email, phone, department, designation, salary, joinDate, user);
        employee.setAddress("Silicon Valley Tech Hub, California");
        employee.setSkills(skills);
        employee.setStatus(status);
        employee.setAvatarUrl(avatarUrl);
        employee.setBio(bio);
        employee.setDob(LocalDate.of(1992 + (int)(Math.random() * 8), 1 + (int)(Math.random() * 11), 1 + (int)(Math.random() * 25)));
        employee.setGender(empId.endsWith("2") || empId.endsWith("4") || empId.endsWith("6") || empId.endsWith("8") ? "Female" : "Male");
        employee.setPhoneVerified(true);

        employeeRepository.save(employee);
    }
}
