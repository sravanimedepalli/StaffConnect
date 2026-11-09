package com.staffconnect.service;

import com.staffconnect.dto.DepartmentDto;
import com.staffconnect.entity.AuditLog;
import com.staffconnect.entity.Department;
import com.staffconnect.exception.BadRequestException;
import com.staffconnect.exception.ResourceNotFoundException;
import com.staffconnect.repository.AuditLogRepository;
import com.staffconnect.repository.DepartmentRepository;
import com.staffconnect.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogRepository auditLogRepository;

    public DepartmentService(DepartmentRepository departmentRepository,
                             EmployeeRepository employeeRepository,
                             AuditLogRepository auditLogRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<DepartmentDto> getAllDepartments() {
        List<Department> departments = departmentRepository.findAll();
        List<Object[]> counts = employeeRepository.countEmployeesByDepartment();
        Map<String, Long> countMap = new HashMap<>();
        for (Object[] row : counts) {
            String deptName = (String) row[0];
            Long count = (Long) row[1];
            if (deptName != null) {
                countMap.put(deptName.toLowerCase(), count);
            }
        }

        return departments.stream().map(dept -> {
            DepartmentDto dto = mapToDto(dept);
            dto.setEmployeeCount(countMap.getOrDefault(dept.getName().toLowerCase(), 0L));
            return dto;
        }).collect(Collectors.toList());
    }

    public DepartmentDto getDepartmentById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        DepartmentDto dto = mapToDto(dept);
        long count = employeeRepository.findByDepartmentIgnoreCase(dept.getName()).size();
        dto.setEmployeeCount(count);
        return dto;
    }

    @Transactional
    public DepartmentDto createDepartment(DepartmentDto dto, String adminEmail) {
        String cleanName = dto.getName().trim();
        String cleanCode = dto.getCode().trim().toUpperCase();

        if (departmentRepository.existsByNameIgnoreCase(cleanName)) {
            throw new BadRequestException("Department with name '" + cleanName + "' already exists");
        }
        if (departmentRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new BadRequestException("Department with code '" + cleanCode + "' already exists");
        }

        Department department = new Department(
                cleanName,
                cleanCode,
                dto.getDescription(),
                dto.getHeadName(),
                dto.getLocation(),
                dto.getBudget() != null ? dto.getBudget() : 0.0
        );

        Department saved = departmentRepository.save(department);
        auditLogRepository.save(new AuditLog("CREATE_DEPARTMENT", "Created department: " + saved.getName(), adminEmail));

        return mapToDto(saved);
    }

    @Transactional
    public DepartmentDto updateDepartment(Long id, DepartmentDto dto, String adminEmail) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        dept.setName(dto.getName().trim());
        dept.setCode(dto.getCode().trim().toUpperCase());
        dept.setDescription(dto.getDescription());
        dept.setHeadName(dto.getHeadName());
        dept.setLocation(dto.getLocation());
        if (dto.getBudget() != null) {
            dept.setBudget(dto.getBudget());
        }

        Department updated = departmentRepository.save(dept);
        auditLogRepository.save(new AuditLog("UPDATE_DEPARTMENT", "Updated department: " + updated.getName(), adminEmail));

        return mapToDto(updated);
    }

    @Transactional
    public void deleteDepartment(Long id, String adminEmail) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        long employeeCount = employeeRepository.findByDepartmentIgnoreCase(dept.getName()).size();
        if (employeeCount > 0) {
            throw new BadRequestException("Cannot delete department '" + dept.getName() + "' because it still has " + employeeCount + " assigned employees.");
        }

        String name = dept.getName();
        departmentRepository.delete(dept);
        auditLogRepository.save(new AuditLog("DELETE_DEPARTMENT", "Deleted department: " + name, adminEmail));
    }

    private DepartmentDto mapToDto(Department dept) {
        return new DepartmentDto(
                dept.getId(),
                dept.getName(),
                dept.getCode(),
                dept.getDescription(),
                dept.getHeadName(),
                dept.getLocation(),
                dept.getBudget(),
                0L
        );
    }
}
