import { fetchGraphQL } from "./graphql.js";
import { renderGraphs } from "./graphs.js";

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
    console.log("XP paths:", data.transaction.map(t => t.path));
    return data.transaction;
}

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

function formatXP(bytes) {
    if (bytes >= 1000000) return (bytes / 1000000).toFixed(2) + " MB";
    if (bytes >= 1000) return (bytes / 1000).toFixed(1) + " kB";
    return bytes + " B";
}

async function loadProfile() {
    try {
        const user = await getUserInfo();
        const xpData = await getXP();
        const auditData = await getAuditRatio();
        const results = await getResults();

        const totalXP = xpData.reduce((sum, t) => sum + t.amount, 0);
        const passed = results.filter(r => r.grade >= 1).length;
        const failed = results.filter(r => r.grade < 1).length;

        document.getElementById("user-info").innerHTML = `
            <div class="info-card">
                <h2>Welcome, ${user.login}</h2>
                <p>User ID: ${user.id}</p>
                <p>Total XP: ${formatXP(totalXP)}</p>
                <p>Audit Ratio: ${auditData.auditRatio.toFixed(1)}</p>
                <p>Audits Done: ${formatXP(auditData.totalUp)}</p>
                <p>Audits Received: ${formatXP(auditData.totalDown)}</p>
                <p>Projects Passed: ${passed} | Failed: ${failed}</p>
            </div>
        `;

        window.profileData = { xpData, auditData, results };
        renderGraphs();
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
}

export { loadProfile };