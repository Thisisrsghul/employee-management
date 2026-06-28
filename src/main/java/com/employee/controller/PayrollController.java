package com.employee.controller;

import com.employee.entity.Payroll;
import com.employee.service.PayrollService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "*")
public class PayrollController {
    @Autowired
    private PayrollService payrollService;

    @PostMapping
    public ResponseEntity<Payroll> addPayroll(@RequestParam Integer employeeId, 
                                             @RequestParam Double bonus,
                                             @RequestParam Double deductions,
                                             @RequestParam String month) {
        return ResponseEntity.ok(payrollService.addPayroll(employeeId, bonus, deductions, LocalDate.parse(month)));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Payroll>> getPayrollByEmployee(@PathVariable Integer employeeId) {
        return ResponseEntity.ok(payrollService.getPayrollByEmployee(employeeId));
    }

    @GetMapping
    public ResponseEntity<List<Payroll>> getAllPayroll() {
        return ResponseEntity.ok(payrollService.getAllPayroll());
    }
}