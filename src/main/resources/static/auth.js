const API_URL = 'http://localhost:8080/api';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    checkIfLoggedIn();
    seedDemoUsers();
});

function checkIfLoggedIn() {
    const user = localStorage.getItem('user');
    if (user) {
        window.location.href = '/dashboard.html';
    }
}

function toggleForm() {
    document.getElementById('loginContainer').classList.toggle('hidden');
    document.getElementById('signupContainer').classList.toggle('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Safe JSON parser — won't throw if server returns plain text
async function safeJson(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return { error: text || 'Unknown error', _raw: text };
    }
}

// ===== HANDLE LOGIN =====
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await safeJson(response);

        if (!response.ok) {
            showToast(data.error || 'Invalid username or password', 'error');
            return;
        }

        localStorage.setItem('user', JSON.stringify({
            userId:   data.userId,
            username: data.username,
            email:    data.email,
            fullName: data.fullName,
            role:     data.role
        }));
        localStorage.setItem('token', data.token);

        showToast(`✓ Welcome ${data.fullName || data.username}!`);
        setTimeout(() => { window.location.href = '/dashboard.html'; }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showToast('Connection error. Is the server running?', 'error');
    }
}

// ===== HANDLE SIGNUP =====
async function handleSignup(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email    = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const role     = document.getElementById('role').value;

    if (!fullName || !username || !email || !password || !role) {
        showToast('Please fill all fields', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, username, email, password, role })
        });

        const data = await safeJson(response);

        if (!response.ok) {
            showToast(data.error || 'Signup failed', 'error');
            return;
        }

        showToast('✓ Account created! Signing you in…');

        // Auto-login after signup
        setTimeout(async () => {
            try {
                const loginRes = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const loginData = await safeJson(loginRes);
                if (loginRes.ok) {
                    localStorage.setItem('user', JSON.stringify({
                        userId:   loginData.userId,
                        username: loginData.username,
                        email:    loginData.email,
                        fullName: loginData.fullName,
                        role:     loginData.role
                    }));
                    localStorage.setItem('token', loginData.token);
                    window.location.href = '/dashboard.html';
                }
            } catch(e) {
                toggleForm(); // fallback: go back to login
            }
        }, 1000);

    } catch (error) {
        console.error('Signup error:', error);
        showToast('Connection error. Is the server running?', 'error');
    }
}

// ===== SEED DEMO USERS (runs once quietly) =====
async function seedDemoUsers() {
    const demoUsers = [
        { username: 'admin',   password: 'admin123',   email: 'admin@ems.com',   role: 'ADMIN',    fullName: 'Admin User'    },
        { username: 'manager', password: 'manager123', email: 'manager@ems.com', role: 'MANAGER',  fullName: 'Manager User'  },
        { username: 'emp1',    password: 'emp123',     email: 'emp1@ems.com',    role: 'EMPLOYEE', fullName: 'Employee One'  }
    ];

    for (const user of demoUsers) {
        try {
            await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            // Intentionally ignore response — user may already exist
        } catch (e) {
            // Server unreachable, skip silently
        }
    }
}
