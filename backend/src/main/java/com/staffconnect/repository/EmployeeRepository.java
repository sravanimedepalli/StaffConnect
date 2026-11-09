package com.staffconnect.repository;

import com.staffconnect.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmailIgnoreCase(String email);
    Optional<Employee> findByEmployeeIdIgnoreCase(String employeeId);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmployeeIdIgnoreCase(String employeeId);

    long countByStatus(String status);

    List<Employee> findByDepartmentIgnoreCase(String department);

    @Query("SELECT e FROM Employee e WHERE " +
           "(:search IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.employeeId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.designation) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:department IS NULL OR :department = '' OR LOWER(e.department) = LOWER(:department)) AND " +
           "(:status IS NULL OR :status = '' OR LOWER(e.status) = LOWER(:status)) " +
           "ORDER BY e.id DESC")
    List<Employee> searchEmployees(@Param("search") String search,
                                  @Param("department") String department,
                                  @Param("status") String status);

    @Query("SELECT e.department, COUNT(e) FROM Employee e GROUP BY e.department")
    List<Object[]> countEmployeesByDepartment();
}
