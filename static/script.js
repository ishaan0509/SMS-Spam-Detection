/**
 * Spam Detection System — Frontend Logic (Swiss Style)
 * Handles prediction requests, chart rendering, and UI updates.
 *
 * PSP Enhancements:
 *  - SPAM_THRESHOLD for classification boundary
 *  - Confidence scoring + uncertainty detection (< 0.1 → LOW CONFIDENCE)
 *  - Prior probability display
 *  - Top contributing words (log-ratio) rendered + console-logged
 *  - /retrain endpoint wired to accuracy stat block
 *  - Smooth animated number transitions
 *  - "ANALYZING…" loading text on button
 */

// ── CHART INSTANCES ──
let distributionChart = null;
let confusionChart    = null;

// ── PSP: Classification threshold ──
// Change this to adjust the decision boundary (0.0 – 1.0)
const SPAM_THRESHOLD = 0.5;

// ── Swiss palette constants ──
const SW_BLACK = '#000000';
const SW_WHITE = '#FFFFFF';
const SW_RED   = '#FF3000';
const SW_MUTED = '#F2F2F2';
const SW_GRAY  = 'rgba(0,0,0,0.08)';

// ── SHARED CHART DEFAULTS ──
Chart.defaults.font.family = "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif";
Chart.defaults.font.weight = '700';
Chart.defaults.color       = SW_BLACK;

// ══════════════════════════════════════
// PAGE LOAD
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    loadStats();

    // Expose threshold in PSP detail panel on first render
    const thresholdEl = document.getElementById('threshold-val');
    if (thresholdEl) thresholdEl.textContent = (SPAM_THRESHOLD * 100).toFixed(0) + '%';

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
    const btnText       = btn.querySelector('.btn-text');
    const outputSection = document.getElementById('output-section');
    const message       = input.value.trim();

    if (!message) {
        input.classList.remove('error-shake');
        void input.offsetWidth; // force reflow to re-trigger animation
        input.classList.add('error-shake');
        input.focus();
        return;
    }

    // Loading state: spinner + "ANALYZING…" text
    btn.classList.add('loading');
    btn.disabled        = true;
    btnText.textContent = 'ANALYZING…';

    try {
        const res = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);

        const data = await res.json();

        // PSP: Override prediction using client-side threshold
        // (Backend already uses 0.5, but JS controls the visual verdict)
        data._clientPrediction = data.prob_spam >= SPAM_THRESHOLD ? 'Spam' : 'Ham';

        // Console log for debugging / PSP demo
        console.group('📊 PSP Spam Analysis');
        console.log('Message           :', message);
        console.log('Threshold         :', SPAM_THRESHOLD);
        console.log('Prediction        :', data._clientPrediction);
        console.log('P(Spam | message) :', (data.prob_spam * 100).toFixed(2) + '%');
        console.log('P(Ham  | message) :', (data.prob_ham  * 100).toFixed(2) + '%');
        console.log('Prior P(Spam)     :', (data.prior_spam * 100).toFixed(2) + '%');
        console.log('Prior P(Ham)      :', (data.prior_ham  * 100).toFixed(2) + '%');
        console.log('Confidence        :', (data.confidence * 100).toFixed(2) + '%');
        console.log('Top words         :', data.top_words);
        console.groupEnd();

        displayResult(data);
        outputSection.classList.remove('hidden');
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        console.error('Prediction failed:', err);
        alert('Could not get prediction. Is the Flask server running?');
    } finally {
        btn.classList.remove('loading');
        btn.disabled        = false;
        btnText.textContent = 'CHECK SPAM';
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

    // Use client-side threshold prediction
    const isSpam   = data._clientPrediction === 'Spam';
    const hamPct   = (data.prob_ham  * 100).toFixed(1);
    const spamPct  = (data.prob_spam * 100).toFixed(1);

    // Verdict badge
    badge.className      = 'prediction-badge ' + (isSpam ? 'spam' : 'ham');
    icon.textContent     = isSpam ? '■' : '●';
    text.textContent     = isSpam ? 'SPAM' : 'HAM';

    // ── PSP: Uncertainty detection ──
    // Inject "LOW CONFIDENCE" warning into the badge if diff < 10%
    const existingWarning = badge.querySelector('.confidence-warn');
    if (existingWarning) existingWarning.remove();

    if (data.confidence < 0.10) {
        const warn = document.createElement('span');
        warn.className   = 'confidence-warn';
        warn.textContent = 'LOW CONFIDENCE';
        warn.setAttribute('aria-label', 'Low confidence prediction');
        warn.style.cssText = `
            font-size: 0.55rem;
            font-weight: 700;
            letter-spacing: 0.18em;
            display: block;
            opacity: 0.75;
            margin-top: 0.25rem;
        `;
        badge.appendChild(warn);
    }

    // Smooth animated number transition for percentage values
    animateValue(hamVal,  parseFloat(hamVal.textContent)  || 0, parseFloat(hamPct),  700, '%');
    animateValue(spamVal, parseFloat(spamVal.textContent) || 0, parseFloat(spamPct), 700, '%');

    // Update ARIA progressbar values
    const hamTrack  = document.getElementById('ham-bar').closest('[role="progressbar"]');
    const spamTrack = document.getElementById('spam-bar').closest('[role="progressbar"]');
    if (hamTrack)  hamTrack.setAttribute('aria-valuenow',  hamPct);
    if (spamTrack) spamTrack.setAttribute('aria-valuenow', spamPct);

    // Animate bars (reset → next frame → target width)
    hamBar.style.width  = '0%';
    spamBar.style.width = '0%';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            hamBar.style.width  = hamPct  + '%';
            spamBar.style.width = spamPct + '%';
        });
    });

    // ── PSP: Render confidence + priors + top words panel ──
    renderPSPDetail(data);
}

// ══════════════════════════════════════
// PSP DETAIL PANEL
// ══════════════════════════════════════
function renderPSPDetail(data) {
    const panel       = document.getElementById('psp-detail');
    const confLabel   = document.getElementById('confidence-label');
    const priorHamEl  = document.getElementById('prior-ham-val');
    const priorSpamEl = document.getElementById('prior-spam-val');
    const thresholdEl = document.getElementById('threshold-val');
    const wordsList   = document.getElementById('top-words-list');

    if (!panel) return;

    // Confidence level label
    const confPct    = (data.confidence * 100).toFixed(1);
    let confText, confColor;

    if (data.confidence >= 0.7) {
        confText  = 'HIGH — ' + confPct + '%';
        confColor = SW_WHITE;
    } else if (data.confidence >= 0.1) {
        confText  = 'MEDIUM — ' + confPct + '%';
        confColor = SW_RED;
    } else {
        confText  = 'LOW — ' + confPct + '%';
        confColor = SW_RED;
    }

    confLabel.textContent   = confText;
    confLabel.style.color   = confColor;

    // Priors
    if (priorHamEl)  priorHamEl.textContent  = (data.prior_ham  * 100).toFixed(2) + '%';
    if (priorSpamEl) priorSpamEl.textContent = (data.prior_spam * 100).toFixed(2) + '%';
    if (thresholdEl) thresholdEl.textContent = (SPAM_THRESHOLD  * 100).toFixed(0) + '%';

    // Top contributing words — render as inline chips
    if (wordsList && data.top_words && data.top_words.length > 0) {
        wordsList.innerHTML = '';

        data.top_words.forEach(({ word, score, direction }) => {
            const chip = document.createElement('span');
            const isSpamWord = direction === 'spam';

            chip.textContent  = word;
            chip.title        = `Log-ratio: ${score > 0 ? '+' : ''}${score}`;
            chip.style.cssText = `
                display: inline-block;
                padding: 0.15rem 0.55rem;
                font-size: 0.62rem;
                font-weight: 700;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                border: 1.5px solid ${isSpamWord ? SW_RED : 'rgba(255,255,255,0.3)'};
                color: ${isSpamWord ? SW_RED : 'rgba(255,255,255,0.7)'};
                background: transparent;
                cursor: default;
            `;

            wordsList.appendChild(chip);
        });
    } else if (wordsList) {
        wordsList.innerHTML = '<span style="font-size:0.62rem;opacity:0.4;">No known words found in vocabulary.</span>';
    }

    // Show the panel
    panel.style.display = 'block';
}

// ══════════════════════════════════════
// SMOOTH NUMBER ANIMATION
// ══════════════════════════════════════
function animateValue(el, from, to, durationMs, suffix = '') {
    if (!el) return;
    const start   = performance.now();
    const delta   = to - from;

    function step(now) {
        const t        = Math.min((now - start) / durationMs, 1);
        const eased    = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const current  = from + delta * eased;
        el.textContent = current.toFixed(1) + suffix;
        if (t < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
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
// RETRAIN MODEL
// ══════════════════════════════════════
async function retrainModel() {
    const statusEl  = document.getElementById('retrain-status');
    const accEl     = document.getElementById('stat-accuracy');
    const statBlock = document.getElementById('stat-acc');

    if (statusEl) statusEl.textContent = 'RETRAINING…';
    if (accEl)    accEl.textContent    = '—';
    if (statBlock) statBlock.style.opacity = '0.6';

    try {
        const res = await fetch('/retrain', { method: 'POST' });
        if (!res.ok) throw new Error('Retrain failed');

        const data = await res.json();

        console.group('🔄 Model Retrained');
        console.log('New accuracy :', data.accuracy + '%');
        console.log('Seed used    :', data.seed);
        console.log('Confusion    :', data.confusion_matrix);
        console.groupEnd();

        if (accEl)    accEl.textContent = data.accuracy + '%';
        if (statusEl) statusEl.textContent = `RETRAINED ✓ (seed ${data.seed})`;

        // Refresh confusion matrix chart with new data
        drawConfusionMatrix(data.confusion_matrix);

        // Reset status label after 4 s
        setTimeout(() => {
            if (statusEl) statusEl.textContent = 'CLICK TO RETRAIN';
        }, 4000);

    } catch (err) {
        console.error('Retrain error:', err);
        if (statusEl) statusEl.textContent = 'RETRAIN FAILED';
        if (accEl)    loadStats(); // reload original value

        setTimeout(() => {
            if (statusEl) statusEl.textContent = 'CLICK TO RETRAIN';
        }, 3000);
    } finally {
        if (statBlock) statBlock.style.opacity = '1';
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
                borderWidth:     0,
                borderRadius:    0,
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
                    grid:   { color: SW_GRAY, lineWidth: 1 },
                    ticks:  { font: { size: 10, weight: '700' }, color: 'rgba(0,0,0,0.4)' },
                    border: { color: SW_BLACK, width: 2 }
                },
                x: {
                    grid:   { display: false },
                    ticks:  { font: { size: 10, weight: '900' }, color: SW_BLACK },
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
                    borderRadius:    0,
                    maxBarThickness: 50
                },
                {
                    label: 'ACTUAL SPAM',
                    data: [cm[1][0], cm[1][1]],
                    backgroundColor: SW_RED,
                    borderRadius:    0,
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
                        font:          { size: 9, weight: '700' },
                        color:         SW_BLACK,
                        boxWidth:      12,
                        boxHeight:     12,
                        padding:       12,
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
                    grid:   { color: SW_GRAY, lineWidth: 1 },
                    ticks:  { font: { size: 10, weight: '700' }, color: 'rgba(0,0,0,0.4)' },
                    border: { color: SW_BLACK, width: 2 }
                },
                x: {
                    grid:   { display: false },
                    ticks:  { font: { size: 9, weight: '900' }, color: SW_BLACK },
                    border: { color: SW_BLACK, width: 2 }
                }
            }
        }
    });
}
