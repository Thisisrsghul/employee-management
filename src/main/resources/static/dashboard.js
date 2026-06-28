const API_URL = 'http://localhost:8080/api';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupNavigation();
    setupMenuToggle();
    applyRoleBasedAccess();
    loadDashboard();
});

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '/index.html';
        return;
    }
    
    currentUser = JSON.parse(userStr);
    document.getElementById('userFullName').textContent = currentUser.fullName;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('roleBadge').textContent = currentUser.role;
    document.getElementById('roleBadge').className = `role-badge role-${currentUser.role.toLowerCase()}`;
}

function applyRoleBasedAccess() {
    const isAdmin = currentUser.role === 'ADMIN';
    const isManager = currentUser.role === 'MANAGER';
    const isEmployee = currentUser.role === 'EMPLOYEE';

    // Show/hide menu items
    document.getElementById('empNav').style.display = (isAdmin || isManager) ? 'flex' : 'none';
    document.getElementById('payNav').style.display = (isAdmin || isManager) ? 'flex' : 'none';
    document.getElementById('attNav').style.display = (isAdmin || isManager) ? 'flex' : 'none';

    // Show/hide form buttons
    document.getElementById('addEmpBtn').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('addPayBtn').style.display = (isAdmin || isManager) ? 'flex' : 'none';
    document.getElementById('addAttBtn').style.display = (isAdmin || isManager) ? 'flex' : 'none';

    // Hide form if no permission
    if (!isAdmin && !isManager) {
        document.getElementById('empForm').style.display = 'none';
        document.getElementById('payForm').style.display = 'none';
        document.getElementById('attForm').style.display = 'none';
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            const sectionEl = document.getElementById(section);
            if (sectionEl) {
                sectionEl.classList.add('active');
                
                if (section === 'dashboard') loadDashboard();
                if (section === 'employees') loadEmployees();
                if (section === 'payroll') loadPayroll();
                if (section === 'attendance') loadAttendance();
            }
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

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }
}

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        const empRes = await fetch(`${API_URL}/employees`);
        const employees = await empRes.json();
        
        document.getElementById('dashTotalEmp').textContent = employees.length;
        const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
        document.getElementById('dashTotalSalary').textContent = `₹${totalSalary.toLocaleString()}`;
        
        const depts = new Set(employees.map(e => e.department));
        document.getElementById('dashDepts').textContent = depts.size;
    } catch (error) {
        console.error('Error:', error);
    }
}

// ===== EMPLOYEES =====
async function addEmployee(e) {
    e.preventDefault();
    
    if (currentUser.role === 'EMPLOYEE') {
        showToast('You do not have permission', 'error');
        return;
    }

    const name = document.getElementById('empName').value;
    const dept = document.getElementById('empDept').value;
    const salary = parseFloat(document.getElementById('empSalary').value);
    const hireDate = document.getElementById('empHireDate').value;

    try {
        const response = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeName: name, department: dept, salary, hireDate })
        });

        if (response.ok) {
            showToast('✓ Employee added');
            document.getElementById('empName').value = '';
            document.getElementById('empSalary').value = '';
            document.getElementById('empHireDate').value = '';
            toggleForm('empForm');
            loadEmployees();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        const employees = await response.json();

        const tbody = document.getElementById('employeeBody');
        tbody.innerHTML = '';

        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No employees</td></tr>';
            return;
        }

        employees.forEach(emp => {
            const deleteBtn = (currentUser.role === 'ADMIN') ? 
                `<button class="btn btn-danger" onclick="deleteEmployee(${emp.employeeId})" style="padding: 6px 12px;">Delete</button>` : '';
            
            tbody.innerHTML += `
                <tr>
                    <td>#${emp.employeeId}</td>
                    <td>${emp.employeeName}</td>
                    <td>${emp.department}</td>
                    <td>₹${emp.salary?.toLocaleString()}</td>
                    <td>${emp.hireDate}</td>
                    <td>${deleteBtn}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteEmployee(id) {
    if (currentUser.role !== 'ADMIN') {
        showToast('Only admins can delete', 'error');
        return;
    }

    if (!confirm('Delete this employee?')) return;

    try {
        await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
        showToast('✓ Deleted');
        loadEmployees();
    } catch (error) {
        showToast('Error', 'error');
    }
}

// ===== PAYROLL =====
async function addPayroll(e) {
    e.preventDefault();
    
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
        showToast('No permission', 'error');
        return;
    }

    const empId = parseInt(document.getElementById('payEmpId').value);
    const bonus = parseFloat(document.getElementById('payBonus').value) || 0;
    const deductions = parseFloat(document.getElementById('payDeductions').value) || 0;
    const month = document.getElementById('payMonth').value;

    try {
        const monthDate = month + '-01';
        const response = await fetch(`${API_URL}/payroll?employeeId=${empId}&bonus=${bonus}&deductions=${deductions}&month=${monthDate}`, {
            method: 'POST'
        });

        if (response.ok) {
            showToast('✓ Payroll added');
            document.getElementById('payEmpId').value = '';
            document.getElementById('payBonus').value = '0';
            document.getElementById('payDeductions').value = '0';
            document.getElementById('payMonth').value = '';
            toggleForm('payForm');
            loadPayroll();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

async function loadPayroll() {
    try {
        const response = await fetch(`${API_URL}/payroll`);
        const payroll = await response.json();

        const tbody = document.getElementById('payrollBody');
        tbody.innerHTML = '';

        if (payroll.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No records</td></tr>';
            return;
        }

        payroll.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>#${p.payrollId}</td>
                    <td>Emp #${p.employeeId}</td>
                    <td>₹${p.basicSalary?.toLocaleString()}</td>
                    <td>₹${p.bonus?.toLocaleString()}</td>
                    <td>₹${p.deductions?.toLocaleString()}</td>
                    <td><strong>₹${p.netSalary?.toLocaleString()}</strong></td>
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
    
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
        showToast('No permission', 'error');
        return;
    }

    const empId = parseInt(document.getElementById('attEmpId').value);
    const date = document.getElementById('attDate').value;
    const status = document.getElementById('attStatus').value;

    try {
        const response = await fetch(`${API_URL}/attendance?employeeId=${empId}&date=${date}&status=${status}`, {
            method: 'POST'
        });

        if (response.ok) {
            showToast('✓ Marked');
            document.getElementById('attEmpId').value = '';
            document.getElementById('attDate').value = '';
            document.getElementById('attStatus').value = '';
            toggleForm('attForm');
            loadAttendance();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

async function loadAttendance() {
    try {
        const response = await fetch(`${API_URL}/attendance`);
        const attendance = await response.json();

        const tbody = document.getElementById('attendanceBody');
        tbody.innerHTML = '';

        if (attendance.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No records</td></tr>';
            return;
        }

        attendance.forEach(att => {
            const statusColor = att.status === 'PRESENT' ? '#48bb78' : att.status === 'ABSENT' ? '#f56565' : '#4299e1';
            tbody.innerHTML += `
                <tr>
                    <td>#${att.attendanceId}</td>
                    <td>Emp #${att.employeeId}</td>
                    <td>${att.attendanceDate}</td>
                    <td><span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 8px; border-radius: 3px;">${att.status}</span></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}