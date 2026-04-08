// Called from profile.js with the fetched data passed as arguments
function renderGraphs(xpData, user, results) {
    const container = document.getElementById("graphs");

    // Create the graph card containers, then draw into them
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
    drawAuditGraph(user);
    drawResultsGraph(results);
}

// ── XP LINE GRAPH ──
// SVG <polyline> connects data points into a line showing cumulative XP over time
function drawXPGraph(transactions) {
    // viewBox dimensions — SVG scales to fit its container regardless of these numbers
    const width = 600;
    const height = 260;
    const padding = 50; // space for axis labels

    // Build cumulative XP: each point = previous total + this transaction's amount
    let cumulative = 0;
    const points = transactions.map((t) => {
        cumulative += t.amount;
        return { date: new Date(t.createdAt), xp: cumulative };
    });

    if (points.length === 0) return;

    const minDate = points[0].date.getTime();
    const maxDate = points[points.length - 1].date.getTime();
    const maxXP = cumulative;

    // SCALING FUNCTIONS — convert data values to SVG pixel coordinates
    // scaleX: maps a date to an x position
    //   (date - min) / (max - min) gives a 0-to-1 fraction
    //   multiply by drawable width, offset by padding
    const scaleX = (date) =>
        padding + ((date.getTime() - minDate) / (maxDate - minDate || 1)) * (width - padding * 2);

    // scaleY: maps an XP value to a y position
    //   SVG y=0 is the TOP, so we subtract from (height - padding) to flip it
    //   higher XP = smaller y = drawn higher on screen
    const scaleY = (xp) =>
        height - padding - (xp / (maxXP || 1)) * (height - padding * 2);

    // Build "x1,y1 x2,y2 x3,y3..." string for the polyline
    const polylinePoints = points.map((p) => `${scaleX(p.date)},${scaleY(p.xp)}`).join(" ");

    // Y-axis: 5 evenly spaced labels + horizontal grid lines
    let yLabels = "";
    for (let i = 0; i <= 4; i++) {
        const xp = (maxXP / 4) * i;
        const y = scaleY(xp);
        const label = xp >= 1000000 ? (xp / 1000000).toFixed(1) + "MB" : (xp / 1000).toFixed(0) + "kB";
        yLabels += `<text x="${padding - 5}" y="${y + 4}" text-anchor="end" class="axis-text">${label}</text>`;
        yLabels += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="grid-line"/>`;
    }

    // X-axis: just the first and last date
    const formatDate = (d) => `${d.getMonth() + 1}/${d.getFullYear()}`;
    const xLabels = `
        <text x="${padding}" y="${height - 15}" class="axis-text">${formatDate(points[0].date)}</text>
        <text x="${width - padding}" y="${height - 15}" text-anchor="end" class="axis-text">${formatDate(points[points.length - 1].date)}</text>
    `;

    // <polyline> draws connected line segments through all the points
    // fill="none" means just the line, no filled area underneath
    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            ${yLabels}
            ${xLabels}
            <polyline points="${polylinePoints}" fill="none" stroke="#7b5b3a" stroke-width="2"/>
        </svg>
    `;

    document.getElementById("xp-graph").innerHTML = svg;
}

// ── AUDIT BAR CHART ──
// Two <rect> bars comparing audits done vs received
function drawAuditGraph(user) {
    const width = 400;
    const height = 260;
    const padding = 50;

    // Find the larger value so we can scale both bars relative to it
    const maxVal = Math.max(user.totalUp, user.totalDown);
    const barWidth = 80;

    // Scale a value to a pixel height within the drawable area
    const scaleH = (val) => ((val / (maxVal || 1)) * (height - padding * 2));

    const doneH = scaleH(user.totalUp);
    const receivedH = scaleH(user.totalDown);

    const formatMB = (val) => (val / 1000000).toFixed(2) + " MB";

    // <rect> x,y is the TOP-LEFT corner, so y = bottom - barHeight to grow upward
    // rx="4" rounds the corners
    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <text x="${width / 2}" y="25" text-anchor="middle" class="ratio-text">
                Ratio: ${user.auditRatio.toFixed(1)}
            </text>

            <rect x="${width / 2 - barWidth - 20}" y="${height - padding - doneH}"
                  width="${barWidth}" height="${doneH}" fill="#7b5b3a" rx="4"/>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Done</text>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - padding - doneH - 8}"
                  text-anchor="middle" class="axis-text">${formatMB(user.totalUp)}</text>

            <rect x="${width / 2 + 20}" y="${height - padding - receivedH}"
                  width="${barWidth}" height="${receivedH}" fill="#c4956a" rx="4"/>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Received</text>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - padding - receivedH - 8}"
                  text-anchor="middle" class="axis-text">${formatMB(user.totalDown)}</text>
        </svg>
    `;

    document.getElementById("audit-graph").innerHTML = svg;
}

// ── PASS/FAIL BAR CHART ──
// Same pattern as audit graph — two bars, one for pass count, one for fail count
function drawResultsGraph(results) {
    const width = 400;
    const height = 260;
    const padding = 50;

    // Count passes (grade >= 1) and fails (grade < 1)
    const passed = results.filter(res => res.grade >= 1).length;
    const failed = results.filter(res => res.grade < 1).length;
    const total = passed + failed;

    if (total === 0) {
        document.getElementById("results-graph").innerHTML = '<p>No results data</p>';
        return;
    }

    const maxVal = Math.max(passed, failed);
    const barWidth = 80;

    // Same scaling logic: value / max * drawable height
    const scaleH = (val) => ((val / (maxVal || 1)) * (height - padding * 2));

    const passH = scaleH(passed);
    const failH = scaleH(failed);

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <rect x="${width / 2 - barWidth - 20}" y="${height - padding - passH}"
                  width="${barWidth}" height="${passH}" fill="#6b8f5e" rx="4"/>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Pass</text>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - padding - passH - 8}"
                  text-anchor="middle" class="axis-text">${passed}</text>

            <rect x="${width / 2 + 20}" y="${height - padding - failH}"
                  width="${barWidth}" height="${failH}" fill="#b5694d" rx="4"/>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Fail</text>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - padding - failH - 8}"
                  text-anchor="middle" class="axis-text">${failed}</text>
        </svg>
    `;

    document.getElementById("results-graph").innerHTML = svg;
}

export { renderGraphs };
