package com.employee.service;

import com.employee.entity.Employee;
import com.employee.entity.Payroll;
import com.employee.repository.EmployeeRepository;
import com.employee.repository.PayrollRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PayrollService {
    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public Payroll addPayroll(Integer employeeId, Double bonus, Double deductions, LocalDate month) {
        Optional<Employee> employee = employeeRepository.findById(employeeId);
        if (employee.isPresent()) {
            Payroll payroll = new Payroll(employeeId, employee.get().getSalary(), bonus, deductions, month);
            return payrollRepository.save(payroll);
        }
        return null;
    }

    public List<Payroll> getPayrollByEmployee(Integer employeeId) {
        return payrollRepository.findByEmployeeId(employeeId);
    }

    public List<Payroll> getAllPayroll() {
        return payrollRepository.findAll();
    }
}