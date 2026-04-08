// Import the function that loads and displays the profile page
import { loadProfile } from "./profile.js";

// The endpoint we POST credentials to in order to get a JWT back
const SIGNIN_URL = "https://learn.reboot01.com/api/auth/signin";

// Base64-encode "username:password" — required format for HTTP Basic authentication
// btoa() = "Binary to ASCII", it encodes a string into base64
// Note: base64 is encoding, NOT encryption — anyone can decode it
function encodeCredentials(username, password) {
    return btoa(`${username}:${password}`);
}

// Send a POST request to the signin endpoint with Basic auth header
// If credentials are valid, the server returns a JWT (JSON Web Token)
// A JWT is a signed token containing our user ID — we use it for all future API calls
async function login(username, password) {
    const response = await fetch(SIGNIN_URL, {
        method: "POST",
        headers: {
            Authorization: `Basic ${encodeCredentials(username, password)}`,
        },
    });

    // If the server returns a non-200 status, credentials were wrong
    if (!response.ok) {
        throw new Error("Invalid credentials");
    }

    // The response body is the JWT string
    const token = await response.json();
    return token;
}

// --- localStorage helpers ---
// localStorage persists data in the browser across page reloads
// We store the JWT here so the user stays logged in after refresh

function saveToken(token) {
    localStorage.setItem("jwt", token);
}

function getToken() {
    return localStorage.getItem("jwt");
}

function removeToken() {
    localStorage.removeItem("jwt");
}

// --- Show/hide the two sections ---
// Both sections exist in the same HTML page (SPA pattern)
// We toggle visibility by adding/removing the "hidden" CSS class

function showProfile() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("profile-section").classList.remove("hidden");
}

function showLogin() {
    document.getElementById("profile-section").classList.add("hidden");
    document.getElementById("login-section").classList.remove("hidden");
}

// --- Form submit handler ---
// e.preventDefault() stops the form from reloading the page (default browser behavior)
// Instead, we handle the login with fetch and stay on the same page
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
        // Show error message if login failed
        errorMsg.textContent = err.message;
    }
});

// --- Logout handler ---
// Remove the JWT and go back to the login screen
document.getElementById("logout-btn").addEventListener("click", () => {
    removeToken();
    showLogin();
});

// --- Auto-login on page load ---
// If a JWT already exists in localStorage, skip login and go straight to profile
if (getToken()) {
    showProfile();
    loadProfile();
}

// Export these so other files (graphql.js, profile.js) can use them
export { getToken, removeToken, showLogin };
