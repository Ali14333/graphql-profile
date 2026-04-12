// sets up the graph section layout and calls each individual graph function
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

// draws a line graph showing cumulative XP earned over time
// x axis is date, y axis is total xp at that point
function drawXPGraph(transactions) {
    const width = 600;
    const height = 260;
    const padding = 50;
    const lineColor = "#7b5b3a";
    const gridSteps = 4; // how many horizontal grid lines

    // build cumulative xp over time so each point includes all previous xp
    let cumulative = 0;
    const points = transactions.map((t) => {
        cumulative += t.amount;
        return { date: new Date(t.createdAt), xp: cumulative };
    });

    if (points.length === 0) return;

    const minDate = points[0].date.getTime();
    const maxDate = points[points.length - 1].date.getTime();
    const maxXP = cumulative;

    // convert a date to an x pixel position within the graph area
    const scaleX = (date) =>
        padding + ((date.getTime() - minDate) / (maxDate - minDate || 1)) * (width - padding * 2);

    // convert an xp value to a y pixel position
    // subtracting from height because svg y axis goes top to bottom
    const scaleY = (xp) =>
        height - padding - (xp / (maxXP || 1)) * (height - padding * 2);

    // turn all points into a space separated string of "x,y" for the polyline
    const polylinePoints = points.map((p) => `${scaleX(p.date)},${scaleY(p.xp)}`).join(" ");

    // y axis labels and horizontal grid lines
    let yLabels = "";
    for (let i = 0; i <= gridSteps; i++) {
        const xp = (maxXP / gridSteps) * i;
        const y = scaleY(xp);
        const label = xp >= 1000000 ? (xp / 1000000).toFixed(1) + "MB" : (xp / 1000).toFixed(0) + "kB";
        yLabels += `<text x="${padding - 5}" y="${y + 4}" text-anchor="end" class="axis-text">${label}</text>`;
        yLabels += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="grid-line"/>`;
    }

    // x axis labels showing start and end dates
    const formatDate = (d) => `${d.getMonth() + 1}/${d.getFullYear()}`;
    const xLabels = `
        <text x="${padding}" y="${height - 15}" class="axis-text">${formatDate(points[0].date)}</text>
        <text x="${width - padding}" y="${height - 15}" text-anchor="end" class="axis-text">${formatDate(points[points.length - 1].date)}</text>
    `;

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            ${yLabels}
            ${xLabels}
            <polyline points="${polylinePoints}" fill="none" stroke="${lineColor}" stroke-width="2"/>
        </svg>
    `;

    document.getElementById("xp-graph").innerHTML = svg;
}

// draws a bar chart comparing audits done vs audits received
// taller bar = more data audited in that direction
function drawAuditGraph(auditData) {
    const width = 400;
    const height = 260;
    const padding = 50;
    const barWidth = 80;
    const doneColor = "#7b5b3a";
    const receivedColor = "#c4956a";

    // scale bar heights relative to whichever is larger
    const maxVal = Math.max(auditData.totalUp, auditData.totalDown);
    const scaleH = (val) => ((val / (maxVal || 1)) * (height - padding * 2));

    const doneH = scaleH(auditData.totalUp);
    const receivedH = scaleH(auditData.totalDown);

    const formatMB = (val) => (val / 1000000).toFixed(2) + " MB";

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <text x="${width / 2}" y="25" text-anchor="middle" class="ratio-text">
                Ratio: ${auditData.auditRatio.toFixed(1)}
            </text>

            <!-- done bar (audits you did for others) -->
            <rect x="${width / 2 - barWidth - 20}" y="${height - padding - doneH}"
                  width="${barWidth}" height="${doneH}" fill="${doneColor}" rx="4"/>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Done</text>
            <text x="${width / 2 - barWidth / 2 - 20}" y="${height - padding - doneH - 8}"
                  text-anchor="middle" class="axis-text">${formatMB(auditData.totalUp)}</text>

            <!-- received bar (audits others did for you) -->
            <rect x="${width / 2 + 20}" y="${height - padding - receivedH}"
                  width="${barWidth}" height="${receivedH}" fill="${receivedColor}" rx="4"/>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - 15}"
                  text-anchor="middle" class="axis-text">Received</text>
            <text x="${width / 2 + barWidth / 2 + 20}" y="${height - padding - receivedH - 8}"
                  text-anchor="middle" class="axis-text">${formatMB(auditData.totalDown)}</text>
        </svg>
    `;

    document.getElementById("audit-graph").innerHTML = svg;
}

// draws a donut pie chart showing the pass/fail ratio for projects
function drawResultsGraph(results) {
    const width = 400;
    const height = 260;
    const cx = width / 2;  // center x of the pie
    const cy = height / 2; // center y of the pie
    const outerRadius = 85;
    const innerRadius = 48; // the hole in the donut
    const passColor = "#6b8f5e";
    const failColor = "#b5694d";
    const cardBg = "#f5ebe0"; // same as the card background so the hole looks hollow
    const legendY = height - 12;

    // count how many projects passed vs failed
    const passed = results.filter(res => res.grade >= 1).length;
    const failed = results.filter(res => res.grade < 1).length;
    const total = passed + failed;

    if (total === 0) {
        document.getElementById("results-graph").innerHTML = '<p>No results data</p>';
        return;
    }

    const passRatio = passed / total;
    const passAngle = passRatio * 360;

    // helper that creates an svg pie slice path between two angles
    // uses the arc command (A) to draw a curved section from the center
    function arc(startAngle, endAngle, color) {
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        const x1 = cx + outerRadius * Math.cos(startRad);
        const y1 = cy + outerRadius * Math.sin(startRad);
        const x2 = cx + outerRadius * Math.cos(endRad);
        const y2 = cy + outerRadius * Math.sin(endRad);
        const large = endAngle - startAngle > 180 ? 1 : 0; // svg needs to know if arc is > 180
        return `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${large} 1 ${x2} ${y2} Z" fill="${color}"/>`;
    }

    // if all pass or all fail, just draw a full circle instead of arcs
    let paths = "";
    if (passed === total) {
        paths = `<circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="${passColor}"/>`;
    } else if (failed === total) {
        paths = `<circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="${failColor}"/>`;
    } else {
        paths = arc(0, passAngle, passColor) + arc(passAngle, 360, failColor);
    }

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            ${paths}
            <!-- inner circle creates the donut hole effect -->
            <circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="${cardBg}"/>
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="ratio-text">${Math.round(passRatio * 100)}%</text>
            <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="axis-text">pass rate</text>

            <!-- legend dots and labels -->
            <circle cx="${cx - 70}" cy="${legendY}" r="5" fill="${passColor}"/>
            <text x="${cx - 59}" y="${legendY + 4}" class="axis-text">Pass (${passed})</text>
            <circle cx="${cx + 30}" cy="${legendY}" r="5" fill="${failColor}"/>
            <text x="${cx + 41}" y="${legendY + 4}" class="axis-text">Fail (${failed})</text>
        </svg>
    `;

    document.getElementById("results-graph").innerHTML = svg;
}

export { renderGraphs };