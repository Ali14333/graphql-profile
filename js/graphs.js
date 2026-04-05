function renderGraphs() {
    const { xpData, auditData } = window.profileData;
    const container = document.getElementById("graphs");

    container.innerHTML = `
        <h2>Statistics</h2>
        <div class="graph-container">
            <div class="graph-card">
                <h3>XP Progress Over Time</h3>
                <div id="xp-graph"></div>
            </div>
            <div class="graph-card">
                <h3>Audit Ratio</h3>
                <div id="audit-graph"></div>
            </div>
        </div>
    `;

    drawXPGraph(xpData);
    drawAuditGraph(auditData);
}

function drawXPGraph(transactions) {
    const width = 600;
    const height = 300;
    const padding = 50;

    // Build cumulative XP over time
    let cumulative = 0;
    const points = transactions.map((t) => {
        cumulative += t.amount;
        return { date: new Date(t.createdAt), xp: cumulative };
    });

    const minDate = points[0].date.getTime();
    const maxDate = points[points.length - 1].date.getTime();
    const maxXP = cumulative;

    // Scale helpers
    const scaleX = (date) =>
        padding + ((date.getTime() - minDate) / (maxDate - minDate)) * (width - padding * 2);
    const scaleY = (xp) =>
        height - padding - (xp / maxXP) * (height - padding * 2);

    // Build polyline points
    const polylinePoints = points.map((p) => `${scaleX(p.date)},${scaleY(p.xp)}`).join(" ");

    // Y-axis labels (5 ticks)
    let yLabels = "";
    for (let i = 0; i <= 4; i++) {
        const xp = (maxXP / 4) * i;
        const y = scaleY(xp);
        const label = xp >= 1000000 ? (xp / 1000000).toFixed(1) + "MB" : (xp / 1000).toFixed(0) + "kB";
        yLabels += `<text x="${padding - 5}" y="${y + 4}" text-anchor="end" class="axis-text">${label}</text>`;
        yLabels += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="grid-line"/>`;
    }

    // X-axis labels (first and last date)
    const formatDate = (d) => `${d.getMonth() + 1}/${d.getFullYear()}`;
    const xLabels = `
        <text x="${padding}" y="${height - 15}" class="axis-text">${formatDate(points[0].date)}</text>
        <text x="${width - padding}" y="${height - 15}" text-anchor="end" class="axis-text">${formatDate(points[points.length - 1].date)}</text>
    `;

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            ${yLabels}
            ${xLabels}
            <polyline points="${polylinePoints}" fill="none" stroke="#4f46e5" stroke-width="2"/>
        </svg>
    `;

    document.getElementById("xp-graph").innerHTML = svg;
}

function drawAuditGraph(auditData) {
    const width = 400;
    const height = 300;
    const padding = 50;

    const maxVal = Math.max(auditData.totalUp, auditData.totalDown);
    const barWidth = 80;

    const scaleH = (val) => ((val / maxVal) * (height - padding * 2));

    const doneH = scaleH(auditData.totalUp);
    const receivedH = scaleH(auditData.totalDown);

    const formatMB = (val) => (val / 1000000).toFixed(2) + " MB";

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <!-- Done bar -->
            <rect x="${width / 2 - barWidth - 20}" y="${height - padding - doneH}"
                  width="${barWidth}" height="${doneH}" fill="#4f46e5" rx="4"/>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Done</text>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - padding - doneH - 8}"
                  text-anchor="middle" class="axis-text">${formatMB(auditData.totalUp)}</text>

            <!-- Received bar -->
            <rect x="${width / 2 + 20}" y="${height - padding - receivedH}"
                  width="${barWidth}" height="${receivedH}" fill="#e54f4f" rx="4"/>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Received</text>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - padding - receivedH - 8}"
                  text-anchor="middle" class="axis-text">${formatMB(auditData.totalDown)}</text>

            <!-- Ratio text -->
            <text x="${width / 2}" y="25" text-anchor="middle" class="ratio-text">
                Ratio: ${auditData.auditRatio.toFixed(1)}
            </text>
        </svg>
    `;

    document.getElementById("audit-graph").innerHTML = svg;
}

export { renderGraphs };