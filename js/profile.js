import { fetchGraphQL } from "./graphql.js";
import { renderGraphs } from "./graphs.js";

// get basic user info (id, login, attributes)
async function getUserInfo() {
    const data = await fetchGraphQL(`{
        user {
            id
            login
            attrs
        }
    }`);
    return data.user[0];
}

// get XP transactions for top level projects in bh-module only
// _nlike excludes deeper nested paths (exercises inside piscines/checkpoints)
// ordered by date so we can graph progress over time
async function getXP() {
    const data = await fetchGraphQL(`{
        transaction(
            where: {
                type: { _eq: "xp" }
                path: { _like: "/bahrain/bh-module/%", _nlike: "/bahrain/bh-module/%/%" }
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

// get audit ratio and totals from the user table
// totalUp = how much you audited others, totalDown = how much others audited you
async function getAuditRatio() {
    const data = await fetchGraphQL(`{
        user {
            auditRatio
            totalUp
            totalDown
        }
    }`);
    return data.user[0];
}

// get pass/fail results for top level projects only
// distinct_on objectId so we only get the latest result per project
// this prevents retries from counting as extra fails
async function getResults() {
    const data = await fetchGraphQL(`{
        result(
            where: {
                path: { _like: "/bahrain/bh-module/%", _nlike: "/bahrain/bh-module/%/%" }
                object: { type: { _eq: "project" } }
            }
            order_by: [{ objectId: asc }, { createdAt: desc }]
            distinct_on: objectId
        ) {
            grade
            object {
                name
            }
        }
    }`);
    return data.result;
}

// format raw byte values into readable strings (kB, MB)
function formatXP(bytes) {
    if (bytes >= 1000000) return (bytes / 1000000).toFixed(2) + " MB";
    if (bytes >= 1000) return (bytes / 1000).toFixed(1) + " kB";
    return bytes + " B";
}

// main function that fetches everything and builds the profile page
async function loadProfile() {
    try {
        const user = await getUserInfo();
        const xpData = await getXP();
        const auditData = await getAuditRatio();
        const results = await getResults();

        // add up all xp transactions to get the total
        const totalXP = xpData.reduce((sum, t) => sum + t.amount, 0);

        // count passes (grade >= 1) vs fails (grade < 1)
        const passed = results.filter(r => r.grade >= 1).length;
        const failed = results.filter(r => r.grade < 1).length;

        // render the stats cards into the user info section
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
                    <div class="value">${auditData.auditRatio.toFixed(1)}</div>
                </div>
                <div class="stat-item">
                    <div class="label">Audits Done</div>
                    <div class="value">${formatXP(auditData.totalUp)}</div>
                </div>
                <div class="stat-item">
                    <div class="label">Audits Received</div>
                    <div class="value">${formatXP(auditData.totalDown)}</div>
                </div>
                <div class="stat-item">
                    <div class="label">Pass / Fail</div>
                    <div class="value">${passed} / ${failed}</div>
                </div>
            </div>
        `;

        // store data globally so graphs.js can access it
        window.profileData = { xpData, auditData, results };
        renderGraphs();
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
}

export { loadProfile };