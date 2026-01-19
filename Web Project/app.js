// ========= localStorage helpers =========
function loadUsers() {
  const raw = localStorage.getItem("ws_users");
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem("ws_users", JSON.stringify(users));
}

function setCurrentUser(username) {
  localStorage.setItem("ws_current_user", username);
}

function getCurrentUser() {
  return localStorage.getItem("ws_current_user");
}

function loadLoginHistory(username) {
  const raw = localStorage.getItem("ws_login_history_" + username);
  return raw ? JSON.parse(raw) : [];
}

function saveLoginHistory(username, history) {
  localStorage.setItem("ws_login_history_" + username, JSON.stringify(history));
}

// ========= Password validation & strength =========
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) errors.push("Too short");
  if (!/[A-Z]/.test(password)) errors.push("Need uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Need lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Need a number");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    errors.push("Need a symbol");

  let score = 5 - errors.length;
  if (score < 0) score = 0;
  return { valid: errors.length === 0, errors, score };
}

function updateStrengthBar(password) {
  const { score } = validatePassword(password);
  const fill = document.getElementById("strength-fill");

  let width = (score / 5) * 100;
  fill.style.width = width + "%";

  // reset classes
  fill.className = "strength-fill";

  if (!password) return;

  if (score <= 2) {
    fill.classList.add("strength-weak");
  } else if (score === 3 || score === 4) {
    fill.classList.add("strength-medium");
  } else if (score === 5) {
    fill.classList.add("strength-strong");
  }
}

// ========= DOM elements =========
const regUsername = document.getElementById("reg-username");
const regPassword = document.getElementById("reg-password");
const regMessage = document.getElementById("reg-message");

const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const loginMessage = document.getElementById("login-message");

const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");
const welcomeText = document.getElementById("welcome-text");
const lastLogin = document.getElementById("last-login");
const loginHistoryList = document.getElementById("login-history-list");

const noteInput = document.getElementById("note-input");
const noteMessage = document.getElementById("note-message");
const notesList = document.getElementById("notes-list");

const themeToggleBtn = document.getElementById("theme-toggle");

// ========= Password visibility (eye icon) =========
document.querySelectorAll(".toggle-pass").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "🙈";
    } else {
      input.type = "password";
      btn.textContent = "👁️";
    }
  });
});

// ========= Theme handling =========
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    if (themeToggleBtn) themeToggleBtn.textContent = "☀️ Light";
  } else {
    document.body.classList.remove("dark-mode");
    if (themeToggleBtn) themeToggleBtn.textContent = "🌙 Dark";
  }
  localStorage.setItem("ws_theme", theme);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-mode");
    applyTheme(isDark ? "light" : "dark");
  });
}

// ========= Registration =========
regPassword.addEventListener("input", () => {
  updateStrengthBar(regPassword.value);
});

document.getElementById("register-btn").addEventListener("click", () => {
  regMessage.textContent = "";
  regMessage.className = "error";

  const username = regUsername.value.trim();
  const password = regPassword.value;

  if (!username || !password) {
    regMessage.textContent = "Username and password are required.";
    return;
  }

  const { valid, errors } = validatePassword(password);
  if (!valid) {
    regMessage.textContent = "Weak password: " + errors.join(", ");
    return;
  }

  const users = loadUsers();
  if (users.some((u) => u.username === username)) {
    regMessage.textContent = "Username already exists.";
    return;
  }

  users.push({ username, password }); // demo only — in real apps, hash passwords
  saveUsers(users);

  regMessage.className = "success";
  regMessage.textContent = "Account created successfully. You can now login.";
  regUsername.value = "";
  regPassword.value = "";
  updateStrengthBar("");
});

// ========= Login =========
document.getElementById("login-btn").addEventListener("click", () => {
  loginMessage.textContent = "";

  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    loginMessage.textContent = "Please enter username and password.";
    return;
  }

  const users = loadUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    loginMessage.textContent = "Invalid username or password.";
    return;
  }

  setCurrentUser(username);

  const now = new Date().toLocaleString();
  let history = loadLoginHistory(username);
  history.push(now);
  // keep only last 5
  if (history.length > 5) {
    history = history.slice(history.length - 5);
  }
  saveLoginHistory(username, history);

  showDashboard();
});

// ========= Notes helpers =========
function loadNotes(username) {
  const raw = localStorage.getItem("ws_notes_" + username);
  return raw ? JSON.parse(raw) : [];
}

function saveNotes(username, notes) {
  localStorage.setItem("ws_notes_" + username, JSON.stringify(notes));
}

function renderNotes() {
  const username = getCurrentUser();
  notesList.innerHTML = "";

  if (!username) return;

  const notes = loadNotes(username);
  notes.forEach((note, index) => {
    const li = document.createElement("li");

    const textDiv = document.createElement("div");
    textDiv.className = "note-text";
    // Safe output to avoid XSS (no innerHTML)
    textDiv.textContent = note.text;

    const metaDiv = document.createElement("div");
    metaDiv.className = "note-meta";

    const dateSpan = document.createElement("span");
    dateSpan.className = "small";
    dateSpan.textContent = note.createdAt;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.marginTop = "2px";
    delBtn.addEventListener("click", () => {
      notes.splice(index, 1);
      saveNotes(username, notes);
      renderNotes();
    });

    metaDiv.appendChild(dateSpan);
    metaDiv.appendChild(delBtn);

    li.appendChild(textDiv);
    li.appendChild(metaDiv);
    notesList.appendChild(li);
  });
}

// ========= Login history rendering =========
function renderLoginHistory(history, username) {
  loginHistoryList.innerHTML = "";
  if (!history || history.length === 0) return;

  // show newest first
  const reversed = [...history].reverse();
  reversed.forEach((timestamp, idx) => {
    const li = document.createElement("li");
    if (idx === 0) {
      li.textContent = "Current session: " + timestamp;
    } else {
      li.textContent = "Previous: " + timestamp;
    }
    loginHistoryList.appendChild(li);
  });

  // Last login text = previous login if exists
  if (reversed.length > 1) {
    lastLogin.textContent = "Last login: " + reversed[1];
  } else {
    lastLogin.textContent = "This is your first login.";
  }
}

// ========= Dashboard show/hide =========
function showDashboard() {
  const username = getCurrentUser();
  if (!username) return;

  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");

  welcomeText.textContent = "Welcome, " + username;

  const history = loadLoginHistory(username);
  renderLoginHistory(history, username);
  renderNotes();
}

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("ws_current_user");
  dashboard.classList.add("hidden");
  authSection.classList.remove("hidden");
});

// ========= Notes events =========
document.getElementById("add-note-btn").addEventListener("click", () => {
  noteMessage.textContent = "";

  const text = noteInput.value.trim();
  if (!text) {
    noteMessage.textContent = "Note cannot be empty.";
    return;
  }
  if (text.length > 200) {
    noteMessage.textContent = "Note is too long (max 200 characters).";
    return;
  }

  const username = getCurrentUser();
  if (!username) return;

  const notes = loadNotes(username);
  notes.push({ text, createdAt: new Date().toLocaleString() });
  saveNotes(username, notes);
  noteInput.value = "";
  renderNotes();
});

// ========= Password generator =========
document
  .getElementById("generate-pass-btn")
  .addEventListener("click", () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}";
    let pass = "";
    const length = 12;
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById("generated-pass").textContent =
      "Generated password: " + pass;
  });

// ========= Security tips rotator =========
const tips = [
  "Use a different password for each important website.",
  "Never share your password with anyone — even friends.",
  "Enable two-factor authentication whenever it is available.",
  "Always check the URL before entering login information.",
  "Avoid clicking on suspicious links in emails or messages."
];
let tipIndex = 0;

function showNextTip() {
  document.getElementById("security-tip").textContent = tips[tipIndex];
  tipIndex = (tipIndex + 1) % tips.length;
}

setInterval(showNextTip, 5000);
showNextTip();

// ========= On page load =========
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("ws_theme") || "light";
  applyTheme(savedTheme);

  if (getCurrentUser()) {
    showDashboard();
  }
});
