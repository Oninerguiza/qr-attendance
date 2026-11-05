// Authentication helpers: hashing, create admin, login, logout, page protection

// Turn bytes into a readable hex string
function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(function (b) { return b.toString(16).padStart(2, "0"); })
    .join("");
}

// Make a random salt
function generateSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

// Hash a password with SHA-256 (salt + password)
async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return toHex(hashBuffer);
}

// Is there at least one admin account?
function adminExists() {
  return getData("admins").length > 0;
}

// Create an admin account (returns an error message, or "" if OK)
async function createAdmin(username, password) {
  username = username.trim();

  if (username.length < 3) return "Username must be at least 3 characters.";
  if (password.length < 6) return "Password must be at least 6 characters.";

  const admins = getData("admins");
  const taken = admins.some(function (a) {
    return a.username.toLowerCase() === username.toLowerCase();
  });
  if (taken) return "That username is already taken.";

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  admins.push({ id: Date.now(), username: username, salt: salt, passwordHash: passwordHash });
  saveData("admins", admins);
  return "";
}

// Log in (returns an error message, or "" if OK)
async function login(username, password) {
  username = username.trim();

  const admin = getData("admins").find(function (a) {
    return a.username.toLowerCase() === username.toLowerCase();
  });
  if (!admin) return "Wrong username or password.";

  const hash = await hashPassword(password, admin.salt);
  if (hash !== admin.passwordHash) return "Wrong username or password.";

  sessionStorage.setItem("loggedInAdmin", admin.username);
  return "";
}

// Put this at the top of every admin page
function requireLogin() {
  if (!sessionStorage.getItem("loggedInAdmin")) {
    window.location.href = "index.html";
  }
}

// Who is logged in?
function getLoggedInAdmin() {
  return sessionStorage.getItem("loggedInAdmin");
}

// Log out and go back to the login page
function logout() {
  sessionStorage.removeItem("loggedInAdmin");
  window.location.href = "index.html";
}