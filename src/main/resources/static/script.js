const API_URL = 'http://localhost:8080/api';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadDashboard();
    setupMenuToggle();
});

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(section).classList.add('active');
            
            if (section === 'dashboard') loadDashboard();
            if (section === 'employees') loadEmployees();
            if (section === 'payroll') loadPayroll();
            if (section === 'attendance') loadAttendance();
        });
    });
}

function setupMenuToggle() {
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
}

function toggleForm(formId) {
    document.getElementById(formId).classList.toggle('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        const empRes = await fetch(`${API_URL}/employees`);
        const employees = await empRes.json();
        
        const payRes = await fetch(`${API_URL}/payroll`);
        const payroll = await payRes.json();
        
        const attRes = await fetch(`${API_URL}/attendance`);
        const attendance = await attRes.json();

        // Update stats
        document.getElementById('dashTotalEmp').textContent = employees.length;
        
        const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
        document.getElementById('dashTotalSalary').textContent = `₹${totalSalary.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        
        const todayPresent = attendance.filter(a => new Date(a.attendanceDate).toDateString() === new Date().toDateString() && a.status === 'PRESENT').length;
        document.getElementById('dashPresent').textContent = todayPresent;
        
        const depts = new Set(employees.map(e => e.department));
        document.getElementById('dashDepts').textContent = depts.size;
        
        // Department chart
        const deptChart = {};
        employees.forEach(e => {
            deptChart[e.department] = (deptChart[e.department] || 0) + 1;
        });
        
        let deptHtml = '<div style="padding: 20px;">';
        for (const [dept, count] of Object.entries(deptChart)) {
            const percentage = (count / employees.length * 100).toFixed(0);
            deptHtml += `
                <div style="margin: 12px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <strong>${dept}</strong>
                        <span>${count} (${percentage}%)</span>
                    </div>
                    <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${percentage}%;" ></div>
                    </div>
                </div>
            `;
        }
        deptHtml += '</div>';
        document.getElementById('deptChart').innerHTML = deptHtml || '<p style="text-align: center; color: #999;">No data</p>';
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ===== EMPLOYEES =====
async function addEmployee(e) {
    e.preventDefault();
    
    const name = document.getElementById('empName').value.trim();
    const dept = document.getElementById('empDept').value;
    const salary = parseFloat(document.getElementById('empSalary').value);
    const hireDate = document.getElementById('empHireDate').value;

    if (!name || !dept || !salary || !hireDate) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeName: name, department: dept, salary, hireDate })
        });

        if (response.ok) {
            showToast('✓ Employee added successfully');
            document.getElementById('empName').value = '';
            document.getElementById('empSalary').value = '';
            document.getElementById('empHireDate').value = '';
            toggleForm('empForm');
            loadEmployees();
            loadDashboard();
        }
    } catch (error) {
        showToast('Error adding employee', 'error');
    }
}

async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        const employees = await response.json();

        const tbody = document.getElementById('employeeBody');
        tbody.innerHTML = '';

        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">No employees found</td></tr>';
            return;
        }

        employees.forEach(emp => {
            tbody.innerHTML += `
                <tr>
                    <td>#${emp.employeeId}</td>
                    <td><strong>${emp.employeeName}</strong></td>
                    <td><span style="background: #edf2f7; padding: 4px 12px; border-radius: 4px;">${emp.department}</span></td>
                    <td>₹${emp.salary?.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td>${emp.hireDate}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteEmployee(${emp.employeeId})" style="padding: 8px 12px;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteEmployee(id) {
    if (!confirm('Are you sure?')) return;

    try {
        await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
        showToast('✓ Employee deleted');
        loadEmployees();
        loadDashboard();
    } catch (error) {
        showToast('Error deleting employee', 'error');
    }
}

// ===== PAYROLL =====
async function addPayroll(e) {
    e.preventDefault();
    
    const empId = parseInt(document.getElementById('payEmpId').value);
    const bonus = parseFloat(document.getElementById('payBonus').value) || 0;
    const deductions = parseFloat(document.getElementById('payDeductions').value) || 0;
    const month = document.getElementById('payMonth').value;

    if (!empId || !month) {
        showToast('Please fill required fields', 'error');
        return;
    }

    try {
        const monthDate = month + '-01';
        const response = await fetch(`${API_URL}/payroll?employeeId=${empId}&bonus=${bonus}&deductions=${deductions}&month=${monthDate}`, {
            method: 'POST'
        });

        if (response.ok) {
            showToast('✓ Payroll record added');
            document.getElementById('payEmpId').value = '';
            document.getElementById('payBonus').value = '0';
            document.getElementById('payDeductions').value = '0';
            document.getElementById('payMonth').value = '';
            toggleForm('payForm');
            loadPayroll();
        } else {
            showToast('Employee not found', 'error');
        }
    } catch (error) {
        showToast('Error adding payroll', 'error');
    }
}

async function loadPayroll() {
    try {
        const response = await fetch(`${API_URL}/payroll`);
        const payroll = await response.json();

        const tbody = document.getElementById('payrollBody');
        tbody.innerHTML = '';

        if (payroll.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">No payroll records</td></tr>';
            return;
        }

        payroll.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>#${p.payrollId}</td>
                    <td>Employee #${p.employeeId}</td>
                    <td>₹${p.basicSalary?.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td>₹${p.bonus?.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td>₹${p.deductions?.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td><strong>₹${p.netSalary?.toLocaleString('en-IN', {maximumFractionDigits: 2})}</strong></td>
                    <td>${p.payrollMonth}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// ===== ATTENDANCE =====
async function markAttendance(e) {
    e.preventDefault();
    
    const empId = parseInt(document.getElementById('attEmpId').value);
    const date = document.getElementById('attDate').value;
    const status = document.getElementById('attStatus').value;

    if (!empId || !date || !status) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/attendance?employeeId=${empId}&date=${date}&status=${status}`, {
            method: 'POST'
        });

        if (response.ok) {
            showToast('✓ Attendance marked');
            document.getElementById('attEmpId').value = '';
            document.getElementById('attDate').value = '';
            document.getElementById('attStatus').value = '';
            toggleForm('attForm');
            loadAttendance();
            loadDashboard();
        }
    } catch (error) {
        showToast('Error marking attendance', 'error');
    }
}

async function loadAttendance() {
    try {
        const response = await fetch(`${API_URL}/attendance`);
        const attendance = await response.json();

        const tbody = document.getElementById('attendanceBody');
        tbody.innerHTML = '';

        if (attendance.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px;">No records</td></tr>';
            return;
        }

        attendance.forEach(att => {
            const statusColor = att.status === 'PRESENT' ? '#48bb78' : att.status === 'ABSENT' ? '#f56565' : '#4299e1';
            tbody.innerHTML += `
                <tr>
                    <td>#${att.attendanceId}</td>
                    <td>Employee #${att.employeeId}</td>
                    <td>${att.attendanceDate}</td>
                    <td><span style="background: ${statusColor}20; color: ${statusColor}; padding: 6px 12px; border-radius: 4px; font-weight: 600;">${att.status}</span></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}