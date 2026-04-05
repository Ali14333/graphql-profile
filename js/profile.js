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

        window.profileData = { xpData, auditData, results };
        renderGraphs();
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
}

export { loadProfile };