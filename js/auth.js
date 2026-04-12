import { loadProfile } from "./profile.js";

const SIGNIN_URL = "https://learn.reboot01.com/api/auth/signin";

// encode username:password into base64 for Basic auth header
function encodeCredentials(username, password) {
    return btoa(`${username}:${password}`);
}

// send credentials to the signin endpoint and get back a JWT token
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

// localStorage helpers for the JWT
function saveToken(token) {
    localStorage.setItem("jwt", token);
}

function getToken() {
    return localStorage.getItem("jwt");
}

function removeToken() {
    localStorage.removeItem("jwt");
}

// toggle between login and profile views
function showProfile() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("profile-section").classList.remove("hidden");
}

function showLogin() {
    document.getElementById("profile-section").classList.add("hidden");
    document.getElementById("login-section").classList.remove("hidden");
}

// handle login form submission
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

// handle logout, clear the token and go back to login screen
document.getElementById("logout-btn").addEventListener("click", () => {
    removeToken();
    showLogin();
});

// if the user already has a token saved, skip login and load profile
if (getToken()) {
    showProfile();
    loadProfile();
}

export { getToken, removeToken, showLogin };