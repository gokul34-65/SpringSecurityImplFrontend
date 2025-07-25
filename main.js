// Section navigation
const API_URL = import.meta.env.VITE_API_URL;
const sections = [
  'section-register',
  'section-login',
  'section-token',
  'section-userinfo',
  'section-tokenplay'
];
function showSection(id) {
  sections.forEach(sec => {
    document.getElementById(sec).style.display = (sec === id) ? '' : 'none';
  });
}
document.getElementById('nav-register').onclick = () => showSection('section-register');
document.getElementById('nav-login').onclick = () => showSection('section-login');
document.getElementById('nav-token').onclick = () => showSection('section-token');
document.getElementById('nav-userinfo').onclick = () => showSection('section-userinfo');
document.getElementById('nav-tokenplay').onclick = () => showSection('section-tokenplay');

// --- JWT Token Storage ---
function saveToken(token) {
  localStorage.setItem('jwt_token', token);
}
function getToken() {
  return localStorage.getItem('jwt_token');
}
function clearToken() {
  localStorage.removeItem('jwt_token');
}

// --- Registration Logic ---
document.getElementById('register-form').onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const roleId = document.getElementById('register-role').value;
  const roleName = roleId === '1' ? 'ADMIN' : 'USER';
  const resultDiv = document.getElementById('register-result');
  resultDiv.textContent = 'Registering...';
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        roles: [{ id: Number(roleId), name: roleName }]
      })
    });
    if (res.status === 201) {
      resultDiv.textContent = 'Registration successful! You can now login.';
    } else {
      const text = await res.text();
      resultDiv.textContent = 'Error: ' + text;
    }
  } catch (err) {
    resultDiv.textContent = 'Network error: ' + err;
  }
};

// --- Login Logic ---
document.getElementById('login-form').onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const resultDiv = document.getElementById('login-result');
  resultDiv.textContent = 'Logging in...';
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.status === 200) {
      const token = await res.text();
      saveToken(token);
      resultDiv.textContent = 'Login successful!';
      showTokenSection();
    } else {
      resultDiv.textContent = 'Login failed: ' + res.status;
    }
  } catch (err) {
    resultDiv.textContent = 'Network error: ' + err;
  }
};

// --- Show Token Section ---
function showTokenSection() {
  showSection('section-token');
  const token = getToken();
  document.getElementById('jwt-token').value = token || '';
  if (token) {
    document.getElementById('token-decoded').innerHTML = renderDecodedToken(token);
    document.getElementById('nav-logout').style.display = '';
  } else {
    document.getElementById('token-decoded').innerHTML = '';
    document.getElementById('nav-logout').style.display = 'none';
  }
}

// --- Logout Logic ---
document.getElementById('nav-logout').onclick = () => {
  clearToken();
  // Clear token display
  document.getElementById('jwt-token').value = '';
  document.getElementById('token-decoded').innerHTML = '';
  showSection('section-login');
  document.getElementById('nav-logout').style.display = 'none';
};

// --- User Info Fetch ---
document.getElementById('fetch-userinfo').onclick = async () => {
  const resultPre = document.getElementById('userinfo-result');
  const token = getToken();
  if (!token) {
    resultPre.textContent = 'No token found. Please login.';
    return;
  }
  resultPre.textContent = 'Fetching...';
  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      resultPre.textContent = JSON.stringify(data, null, 2);
    } else {
      resultPre.textContent = 'Error: ' + res.status;
    }
  } catch (err) {
    resultPre.textContent = 'Network error: ' + err;
  }
};

// --- Token Playground (Decode JWT) ---
document.getElementById('tokenplay-form').onsubmit = (e) => {
  e.preventDefault();
  const token = document.getElementById('tokenplay-input').value.trim();
  if (!token) {
    document.getElementById('tokenplay-result').textContent = 'Please paste a JWT token.';
    return;
  }
  document.getElementById('tokenplay-result').innerHTML = renderDecodedToken(token);
};

// --- Helper: Decode JWT ---
function renderDecodedToken(token) {
  try {
    const [header, payload, signature] = token.split('.');
    const decode = (str) => JSON.parse(atob(str.replace(/-/g, '+').replace(/_/g, '/')));
    const h = decode(header);
    const p = decode(payload);
    // Expiry
    let exp = '';
    if (p.exp) {
      const now = Math.floor(Date.now() / 1000);
      const seconds = p.exp - now;
      exp = `<br><b>Expires in:</b> ${seconds > 0 ? seconds + 's' : 'Expired'}`;
    }
    return `<b>Header:</b><pre>${JSON.stringify(h, null, 2)}</pre><b>Payload:</b><pre>${JSON.stringify(p, null, 2)}</pre>${exp}`;
  } catch (e) {
    return 'Invalid JWT token.';
  }
}

// --- On Load: Show token if present ---
window.onload = () => {
  if (getToken()) {
    showTokenSection();
  }
}; 