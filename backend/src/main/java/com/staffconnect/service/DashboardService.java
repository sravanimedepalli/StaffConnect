package com.staffconnect.service;

import com.staffconnect.dto.DashboardStatsDto;
import com.staffconnect.entity.Employee;
import com.staffconnect.repository.AuditLogRepository;
import com.staffconnect.repository.DepartmentRepository;
import com.staffconnect.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmployeeService employeeService;

    public DashboardService(EmployeeRepository employeeRepository,
                            DepartmentRepository departmentRepository,
                            AuditLogRepository auditLogRepository,
                            EmployeeService employeeService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.auditLogRepository = auditLogRepository;
        this.employeeService = employeeService;
    }

    public DashboardStatsDto getAdminStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        List<Employee> allEmployees = employeeRepository.findAll();
        stats.setTotalEmployees(allEmployees.size());
        stats.setActiveEmployees(employeeRepository.countByStatus("ACTIVE"));
        stats.setOnLeaveEmployees(employeeRepository.countByStatus("ON_LEAVE"));
        stats.setInactiveEmployees(employeeRepository.countByStatus("INACTIVE"));
        stats.setDepartmentCount(departmentRepository.count());

        // New hires this month
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        long newHires = allEmployees.stream()
                .filter(e -> e.getJoiningDate() != null && !e.getJoiningDate().isBefore(startOfMonth))
                .count();
        stats.setNewHiresThisMonth(newHires);

        // Department distribution
        Map<String, Long> deptDistribution = new LinkedHashMap<>();
        for (Employee e : allEmployees) {
            String dept = e.getDepartment() != null ? e.getDepartment() : "Unassigned";
            deptDistribution.put(dept, deptDistribution.getOrDefault(dept, 0L) + 1);
        }
        stats.setDepartmentDistribution(deptDistribution);

        // Monthly trends for past 6 months
        Map<String, Long> trends = new LinkedHashMap<>();
        DateTimeFormatter monthYearFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            String label = monthDate.format(monthYearFormatter);
            trends.put(label, 0L);
        }
        for (Employee e : allEmployees) {
            if (e.getJoiningDate() != null) {
                String label = e.getJoiningDate().format(monthYearFormatter);
                if (trends.containsKey(label)) {
                    trends.put(label, trends.get(label) + 1);
                }
            }
        }
        stats.setMonthlyJoinTrends(trends);

        // Recent activities
        stats.setRecentActivities(auditLogRepository.findTop15ByOrderByTimestampDesc());

        // Recent 5 employees
        List<Employee> recentList = allEmployees.stream()
                .sorted(Comparator.comparing(Employee::getId).reversed())
                .limit(5)
                .toList();
        stats.setRecentEmployees(recentList.stream().map(employeeService::mapToDto).collect(Collectors.toList()));

        return stats;
    }

    public Map<String, Object> getEmployeeDashboardInfo(String email) {
        Employee employee = employeeRepository.findByEmailIgnoreCase(email).orElse(null);
        Map<String, Object> data = new HashMap<>();

        if (employee != null) {
            data.put("profile", employeeService.mapToDto(employee));
            // Colleagues in the same department
            List<Employee> teammates = employeeRepository.findByDepartmentIgnoreCase(employee.getDepartment())
                    .stream()
                    .filter(e -> !e.getEmail().equalsIgnoreCase(email))
                    .limit(6)
                    .toList();
            data.put("teammates", teammates.stream().map(employeeService::mapToDto).collect(Collectors.toList()));
            data.put("departmentHead", departmentRepository.findByNameIgnoreCase(employee.getDepartment())
                    .map(d -> d.getHeadName() != null ? d.getHeadName() : "Department Lead")
                    .orElse("Department Lead"));
        }

        data.put("totalColleagues", employeeRepository.countByStatus("ACTIVE"));
        data.put("totalDepartments", departmentRepository.count());

        return data;
    }
}
