import { fetchGraphQL } from "./graphql.js";
import { renderGraphs } from "./graphs.js";

// --- QUERY TYPE 1: Normal query (no arguments, no nesting) ---
// Just asks for fields on the user table
// The JWT scopes it to only our data, so user array has one element
async function getUser() {
    const data = await fetchGraphQL(`{
        user {
            id
            login
            auditRatio
            totalUp
            totalDown
        }
    }`);
    return data.user[0];
}

// --- QUERY TYPE 2 & 3: Query with arguments + nested query ---
// Arguments: where filters by type="xp" and path containing "/bh-module/"
//   _eq = equals, _like = pattern match (% is wildcard)
//   order_by sorts results by date ascending
// Nesting: object { name } traverses the foreign key from transaction to object table
//   This gets the project name without needing a separate query
async function getXP() {
    const data = await fetchGraphQL(`{
        transaction(
            where: {
                type: { _eq: "xp" }
                path: { _like: "%/bh-module/%" }
            }
            order_by: { createdAt: asc }
        ) {
            amount
            createdAt
            path
            object {
                name
            }
        }
    }`);
    return data.transaction;
}

// --- Also uses arguments + nesting (same patterns as getXP) ---
async function getResults() {
    const data = await fetchGraphQL(`{
        result(
            where: {
                path: { _like: "%/bh-module/%" }
            }
            order_by: { createdAt: asc }
        ) {
            grade
            object {
                name
            }
        }
    }`);
    return data.result;
}

// Convert raw byte values into readable format (kB / MB)
function formatXP(bytes) {
    if (bytes >= 1000000) return (bytes / 1000000).toFixed(2) + " MB";
    if (bytes >= 1000) return (bytes / 1000).toFixed(1) + " kB";
    return bytes + " B";
}

// --- Main function: fetch all data, display info cards, then render graphs ---
async function loadProfile() {
    try {
        // Fetch data from 3 separate GraphQL queries
        const user = await getUser();
        const xpData = await getXP();
        const results = await getResults();

        // reduce: loop through array, accumulate total XP
        // starts at 0, adds each transaction's amount
        const totalXP = xpData.reduce((sum, t) => sum + t.amount, 0);

        // filter: returns new array with only matching elements
        // grade >= 1 means pass, < 1 means fail
        const passed = results.filter(r => r.grade >= 1).length;
        const failed = results.filter(r => r.grade < 1).length;

        // Inject the stat cards into the DOM using innerHTML
        document.getElementById("user-info").innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="label">User</div>
                    <div class="value">${user.login}</div>
                </div>
                <div class="stat-item">
                    <div class="label">Total XP</div>
                    <div class="value">${formatXP(totalXP)}</div>
                </div>
                <div class="stat-item">
                    <div class="label">Audit Ratio</div>
                    <div class="value">${user.auditRatio.toFixed(1)}</div>
                </div>
                <div class="stat-item">
                    <div class="label">Audits Done</div>
                    <div class="value">${formatXP(user.totalUp)}</div>
                </div>
                <div class="stat-item">
                    <div class="label">Audits Received</div>
                    <div class="value">${formatXP(user.totalDown)}</div>
                </div>
                <div class="stat-item">
                    <div class="label">Pass / Fail</div>
                    <div class="value">${passed} / ${failed}</div>
                </div>
            </div>
        `;

        // Pass all data to the graphs module as arguments
        renderGraphs(xpData, user, results);
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
}

export { loadProfile };
