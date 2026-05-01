/**
 * Spam Detection System — Frontend Logic (Swiss Style)
 * Handles prediction requests, chart rendering, and UI updates.
 */

// ── CHART INSTANCES ──
let distributionChart = null;
let confusionChart    = null;

// Swiss palette constants
const SW_BLACK  = '#000000';
const SW_WHITE  = '#FFFFFF';
const SW_RED    = '#FF3000';
const SW_MUTED  = '#F2F2F2';
const SW_GRAY   = 'rgba(0,0,0,0.08)';

// ── SHARED CHART DEFAULTS ──
Chart.defaults.font.family = "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif";
Chart.defaults.font.weight = '700';
Chart.defaults.color       = SW_BLACK;

// ══════════════════════════════════════
// PAGE LOAD
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    loadStats();

    // Ctrl/Cmd+Enter shortcut
    document.getElementById('message-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) checkSpam();
    });
});

// ══════════════════════════════════════
// CHECK SPAM — main action
// ══════════════════════════════════════
async function checkSpam() {
    const input         = document.getElementById('message-input');
    const btn           = document.getElementById('check-btn');
    const outputSection = document.getElementById('output-section');
    const message       = input.value.trim();

    if (!message) {
        input.classList.remove('error-shake');
        // Force reflow so re-adding class re-triggers animation
        void input.offsetWidth;
        input.classList.add('error-shake');
        input.focus();
        return;
    }

    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const res = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!res.ok) throw new Error('Server error');

        const data = await res.json();
        displayResult(data);
        outputSection.classList.remove('hidden');
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        console.error('Prediction failed:', err);
        alert('Could not get prediction. Is the Flask server running?');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ══════════════════════════════════════
// DISPLAY RESULT
// ══════════════════════════════════════
function displayResult(data) {
    const badge   = document.getElementById('prediction-badge');
    const icon    = document.getElementById('prediction-icon');
    const text    = document.getElementById('prediction-text');
    const hamBar  = document.getElementById('ham-bar');
    const spamBar = document.getElementById('spam-bar');
    const hamVal  = document.getElementById('ham-value');
    const spamVal = document.getElementById('spam-value');

    const isSpam   = data.prediction === 'Spam';
    const hamPct   = (data.prob_ham  * 100).toFixed(1);
    const spamPct  = (data.prob_spam * 100).toFixed(1);

    // Verdict badge
    badge.className = 'prediction-badge ' + (isSpam ? 'spam' : 'ham');
    icon.textContent = isSpam ? '■' : '●';
    text.textContent = isSpam ? 'SPAM' : 'HAM';

    // Probability values
    hamVal.textContent  = hamPct  + '%';
    spamVal.textContent = spamPct + '%';

    // Update ARIA progressbar values
    const hamRow  = document.getElementById('ham-bar').closest('[role="progressbar"]');
    const spamRow = document.getElementById('spam-bar').closest('[role="progressbar"]');
    if (hamRow)  hamRow.setAttribute('aria-valuenow',  hamPct);
    if (spamRow) spamRow.setAttribute('aria-valuenow', spamPct);

    // Animate bars (reset → next frame → set)
    hamBar.style.width  = '0%';
    spamBar.style.width = '0%';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            hamBar.style.width  = hamPct  + '%';
            spamBar.style.width = spamPct + '%';
        });
    });
}

// ══════════════════════════════════════
// LOAD STATS
// ══════════════════════════════════════
async function loadStats() {
    try {
        const res = await fetch('/stats');
        if (!res.ok) throw new Error('Stats unavailable');
        const data = await res.json();

        document.getElementById('stat-ham-count').textContent  = data.ham_count.toLocaleString();
        document.getElementById('stat-spam-count').textContent = data.spam_count.toLocaleString();
        document.getElementById('stat-accuracy').textContent   = data.accuracy + '%';

        drawDistributionChart(data.ham_count, data.spam_count);
        drawConfusionMatrix(data.confusion_matrix);

    } catch (err) {
        console.error('Stats load failed:', err);
    }
}

// ══════════════════════════════════════
// DISTRIBUTION CHART — Swiss palette
// ══════════════════════════════════════
function drawDistributionChart(ham, spam) {
    const ctx = document.getElementById('distribution-chart').getContext('2d');
    if (distributionChart) distributionChart.destroy();

    distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['HAM', 'SPAM'],
            datasets: [{
                label: 'COUNT',
                data: [ham, spam],
                backgroundColor: [SW_BLACK, SW_RED],
                borderColor:     [SW_BLACK, SW_RED],
                borderWidth: 0,
                borderRadius: 0,          // Strictly rectangular
                maxBarThickness: 80
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: { padding: 0 },
            plugins: {
                legend: { display: false },
                title:  { display: false },
                tooltip: {
                    backgroundColor: SW_BLACK,
                    titleColor:      SW_WHITE,
                    bodyColor:       SW_WHITE,
                    borderColor:     SW_RED,
                    borderWidth:     1,
                    padding:         10,
                    titleFont: { size: 10, weight: '700', family: "'Inter'" },
                    bodyFont:  { size: 12, weight: '900', family: "'Inter'" },
                    callbacks: {
                        label: (ctx) => ' ' + ctx.parsed.y.toLocaleString() + ' MESSAGES'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: SW_GRAY, lineWidth: 1 },
                    ticks: { font: { size: 10, weight: '700' }, color: 'rgba(0,0,0,0.4)' },
                    border: { color: SW_BLACK, width: 2 }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10, weight: '900' }, color: SW_BLACK },
                    border: { color: SW_BLACK, width: 2 }
                }
            }
        }
    });
}

// ══════════════════════════════════════
// CONFUSION MATRIX — Swiss palette
// ══════════════════════════════════════
function drawConfusionMatrix(cm) {
    const ctx = document.getElementById('confusion-chart').getContext('2d');
    if (confusionChart) confusionChart.destroy();

    // cm = [[TN, FP], [FN, TP]]
    confusionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['PRED. HAM', 'PRED. SPAM'],
            datasets: [
                {
                    label: 'ACTUAL HAM',
                    data: [cm[0][0], cm[0][1]],
                    backgroundColor: SW_BLACK,
                    borderRadius: 0,
                    maxBarThickness: 50
                },
                {
                    label: 'ACTUAL SPAM',
                    data: [cm[1][0], cm[1][1]],
                    backgroundColor: SW_RED,
                    borderRadius: 0,
                    maxBarThickness: 50
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: { padding: 0 },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 9, weight: '700' },
                        color: SW_BLACK,
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 12,
                        usePointStyle: false
                    }
                },
                title: { display: false },
                tooltip: {
                    backgroundColor: SW_BLACK,
                    titleColor:      SW_WHITE,
                    bodyColor:       SW_WHITE,
                    borderColor:     SW_RED,
                    borderWidth:     1,
                    padding:         10,
                    titleFont: { size: 10, weight: '700', family: "'Inter'" },
                    bodyFont:  { size: 12, weight: '900', family: "'Inter'" },
                    callbacks: {
                        label: (ctx) => ' ' + ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString()
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: SW_GRAY, lineWidth: 1 },
                    ticks: { font: { size: 10, weight: '700' }, color: 'rgba(0,0,0,0.4)' },
                    border: { color: SW_BLACK, width: 2 }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 9, weight: '900' }, color: SW_BLACK },
                    border: { color: SW_BLACK, width: 2 }
                }
            }
        }
    });
}
