package com.staffconnect.dto;

import com.staffconnect.entity.AuditLog;
import java.util.List;
import java.util.Map;

public class DashboardStatsDto {
    private long totalEmployees;
    private long activeEmployees;
    private long onLeaveEmployees;
    private long inactiveEmployees;
    private long departmentCount;
    private long newHiresThisMonth;
    private Map<String, Long> departmentDistribution;
    private Map<String, Long> monthlyJoinTrends;
    private List<AuditLog> recentActivities;
    private List<EmployeeDto> recentEmployees;

    public DashboardStatsDto() {
    }

    public long getTotalEmployees() {
        return totalEmployees;
    }

    public void setTotalEmployees(long totalEmployees) {
        this.totalEmployees = totalEmployees;
    }

    public long getActiveEmployees() {
        return activeEmployees;
    }

    public void setActiveEmployees(long activeEmployees) {
        this.activeEmployees = activeEmployees;
    }

    public long getOnLeaveEmployees() {
        return onLeaveEmployees;
    }

    public void setOnLeaveEmployees(long onLeaveEmployees) {
        this.onLeaveEmployees = onLeaveEmployees;
    }

    public long getInactiveEmployees() {
        return inactiveEmployees;
    }

    public void setInactiveEmployees(long inactiveEmployees) {
        this.inactiveEmployees = inactiveEmployees;
    }

    public long getDepartmentCount() {
        return departmentCount;
    }

    public void setDepartmentCount(long departmentCount) {
        this.departmentCount = departmentCount;
    }

    public long getNewHiresThisMonth() {
        return newHiresThisMonth;
    }

    public void setNewHiresThisMonth(long newHiresThisMonth) {
        this.newHiresThisMonth = newHiresThisMonth;
    }

    public Map<String, Long> getDepartmentDistribution() {
        return departmentDistribution;
    }

    public void setDepartmentDistribution(Map<String, Long> departmentDistribution) {
        this.departmentDistribution = departmentDistribution;
    }

    public Map<String, Long> getMonthlyJoinTrends() {
        return monthlyJoinTrends;
    }

    public void setMonthlyJoinTrends(Map<String, Long> monthlyJoinTrends) {
        this.monthlyJoinTrends = monthlyJoinTrends;
    }

    public List<AuditLog> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<AuditLog> recentActivities) {
        this.recentActivities = recentActivities;
    }

    public List<EmployeeDto> getRecentEmployees() {
        return recentEmployees;
    }

    public void setRecentEmployees(List<EmployeeDto> recentEmployees) {
        this.recentEmployees = recentEmployees;
    }
}
