import { loadProfile } from "./profile.js";

const SIGNIN_URL = "https://learn.reboot01.com/api/auth/signin";

function encodeCredentials(username, password) {
    return btoa(`${username}:${password}`);
}

// POST to signin endpoint, return JWT
async function login(username, password) {
    const response = await fetch(SIGNIN_URL, {
        method: "POST",
        headers: {
            Authorization: `Basic ${encodeCredentials(username, password)}`,
        },
    });

    if (!response.ok) {
        throw new Error("Invalid credentials");
    }

    const token = await response.json();
    return token;
}

// Save JWT to localstorage
function saveToken(token) {
    localStorage.setItem("jwt", token);
}

function getToken() {
    return localStorage.getItem("jwt");
}

function removeToken() {
    localStorage.removeItem("jwt");
}

// Show/hide sections
function showProfile() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("profile-section").classList.remove("hidden");
}

function showLogin() {
    document.getElementById("profile-section").classList.add("hidden");
    document.getElementById("login-section").classList.remove("hidden");
}

// Wire up the form
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    try {
        const token = await login(username, password);
        saveToken(token);
        errorMsg.textContent = "";
        showProfile();
        await loadProfile();
    } catch (err) {
        errorMsg.textContent = err.message;
    }
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    removeToken();
    showLogin();
});

// On page load, check if already logged in
if (getToken()) {
    showProfile();
    loadProfile();
}

export { getToken, removeToken, showLogin };