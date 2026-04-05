function renderGraphs() {
    const { xpData, auditData, results } = window.profileData;
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
            <div class="graph-card">
                <h3>Project Results</h3>
                <div id="results-graph"></div>
            </div>
        </div>
    `;

    drawXPGraph(xpData);
    drawAuditGraph(auditData);
    drawResultsGraph(results);
}

function drawXPGraph(transactions) {
    const width = 600;
    const height = 260;
    const padding = 50;

    let cumulative = 0;
    const points = transactions.map((t) => {
        cumulative += t.amount;
        return { date: new Date(t.createdAt), xp: cumulative };
    });

    if (points.length === 0) return;

    const minDate = points[0].date.getTime();
    const maxDate = points[points.length - 1].date.getTime();
    const maxXP = cumulative;

    const scaleX = (date) =>
        padding + ((date.getTime() - minDate) / (maxDate - minDate || 1)) * (width - padding * 2);
    const scaleY = (xp) =>
        height - padding - (xp / (maxXP || 1)) * (height - padding * 2);

    const polylinePoints = points.map((p) => `${scaleX(p.date)},${scaleY(p.xp)}`).join(" ");

    let yLabels = "";
    for (let i = 0; i <= 4; i++) {
        const xp = (maxXP / 4) * i;
        const y = scaleY(xp);
        const label = xp >= 1000000 ? (xp / 1000000).toFixed(1) + "MB" : (xp / 1000).toFixed(0) + "kB";
        yLabels += `<text x="${padding - 5}" y="${y + 4}" text-anchor="end" class="axis-text">${label}</text>`;
        yLabels += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="grid-line"/>`;
    }

    const formatDate = (d) => `${d.getMonth() + 1}/${d.getFullYear()}`;
    const xLabels = `
        <text x="${padding}" y="${height - 15}" class="axis-text">${formatDate(points[0].date)}</text>
        <text x="${width - padding}" y="${height - 15}" text-anchor="end" class="axis-text">${formatDate(points[points.length - 1].date)}</text>
    `;

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            ${yLabels}
            ${xLabels}
            <polyline points="${polylinePoints}" fill="none" stroke="#7b5b3a" stroke-width="2"/>
        </svg>
    `;

    document.getElementById("xp-graph").innerHTML = svg;
}

function drawAuditGraph(auditData) {
    const width = 400;
    const height = 260;
    const padding = 50;

    const maxVal = Math.max(auditData.totalUp, auditData.totalDown);
    const barWidth = 80;

    const scaleH = (val) => ((val / (maxVal || 1)) * (height - padding * 2));

    const doneH = scaleH(auditData.totalUp);
    const receivedH = scaleH(auditData.totalDown);

    const formatMB = (val) => (val / 1000000).toFixed(2) + " MB";

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <text x="${width / 2}" y="25" text-anchor="middle" class="ratio-text">
                Ratio: ${auditData.auditRatio.toFixed(1)}
            </text>

            <rect x="${width / 2 - barWidth - 20}" y="${height - padding - doneH}"
                  width="${barWidth}" height="${doneH}" fill="#7b5b3a" rx="4"/>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Done</text>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - padding - doneH - 8}"
                  text-anchor="middle" class="axis-text">${formatMB(auditData.totalUp)}</text>

            <rect x="${width / 2 + 20}" y="${height - padding - receivedH}"
                  width="${barWidth}" height="${receivedH}" fill="#c4956a" rx="4"/>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Received</text>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - padding - receivedH - 8}"
                  text-anchor="middle" class="axis-text">${formatMB(auditData.totalDown)}</text>
        </svg>
    `;

    document.getElementById("audit-graph").innerHTML = svg;
}

function drawResultsGraph(results) {
    const width = 400;
    const height = 260;
    const cx = width / 2;
    const cy = height / 2;
    const r = 85;

    const passed = results.filter(res => res.grade >= 1).length;
    const failed = results.filter(res => res.grade < 1).length;
    const total = passed + failed;

    if (total === 0) {
        document.getElementById("results-graph").innerHTML = '<p>No results data</p>';
        return;
    }

    const passRatio = passed / total;
    const passAngle = passRatio * 360;

    function arc(startAngle, endAngle, color) {
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        const large = endAngle - startAngle > 180 ? 1 : 0;
        return `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${color}"/>`;
    }

    let paths = "";
    if (passed === total) {
        paths = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#6b8f5e"/>`;
    } else if (failed === total) {
        paths = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#b5694d"/>`;
    } else {
        paths = arc(0, passAngle, "#6b8f5e") + arc(passAngle, 360, "#b5694d");
    }

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            ${paths}
            <circle cx="${cx}" cy="${cy}" r="48" fill="#f5ebe0"/>
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="ratio-text">${Math.round(passRatio * 100)}%</text>
            <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="axis-text">pass rate</text>

            <circle cx="${cx - 70}" cy="${height - 12}" r="5" fill="#6b8f5e"/>
            <text x="${cx - 59}" y="${height - 8}" class="axis-text">Pass (${passed})</text>
            <circle cx="${cx + 30}" cy="${height - 12}" r="5" fill="#b5694d"/>
            <text x="${cx + 41}" y="${height - 8}" class="axis-text">Fail (${failed})</text>
        </svg>
    `;

    document.getElementById("results-graph").innerHTML = svg;
}

export { renderGraphs };