/* ----------------------------------------------------------------
   Shared helpers
---------------------------------------------------------------- */
function fmtINR(n) {
  n = Math.round(n);
  const s = Math.abs(n).toString();
  let last3 = s.length > 3 ? s.slice(-3) : s;
  let rest = s.length > 3 ? s.slice(0, -3) : '';
  if (rest !== '') last3 = ',' + last3;
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last3;
  return (n < 0 ? '-₹' : '₹') + grouped;
}

const charts = {}; // registry so we can destroy/recreate canvases cleanly
function renderChart(canvasId, config) {
  if (charts[canvasId]) charts[canvasId].destroy();
  const ctx = document.getElementById(canvasId).getContext('2d');
  charts[canvasId] = new Chart(ctx, config);
}

const PALETTE = { ink: '#16302B', brass: '#B8863A', growth: '#3F7A5E', alert: '#A13D2E', line: '#D2C9A6' };

/* ----------------------------------------------------------------
   History (localStorage now, backend hook for Member 3's API)
---------------------------------------------------------------- */
const HISTORY_KEY = 'finmentor_calc_history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch (e) { return []; }
}
function saveHistoryLocal(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

// Member 3's backend: POST /api/history  { type, summary, timestamp }
// Fails silently and falls back to local-only if the backend isn't wired
// up yet, or the user is offline - the calculator still fully works.
async function pushToBackend(record) {
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    document.getElementById('sync-note').textContent = '';
  } catch (e) {
    document.getElementById('sync-note').textContent =
      'Saved locally on this device — backend sync unavailable right now.';
  }
}

function addToHistory(type, summary) {
  const record = { type, summary, timestamp: new Date().toISOString() };
  const list = loadHistory();
  list.unshift(record);
  saveHistoryLocal(list.slice(0, 25)); // keep it light
  pushToBackend(record);
  renderHistory();
}

function renderHistory() {
  const list = loadHistory();
  const el = document.getElementById('history-list');
  if (!list.length) {
    el.innerHTML = '<p class="empty-hist">No calculations yet — try one above.</p>';
    return;
  }
  el.innerHTML = list.map(r => `
    <div class="history-item">
      <div><span class="h-type">${r.type}</span> — ${r.summary}</div>
      <div class="h-meta">${new Date(r.timestamp).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</div>
    </div>
  `).join('');
}

document.getElementById('clear-history-btn').onclick = () => {
  saveHistoryLocal([]);
  renderHistory();
};

/* ----------------------------------------------------------------
   Tabs / panels
---------------------------------------------------------------- */
const CALCULATORS = [
  { id: 'sip', label: 'SIP', icon: '📈' },
  { id: 'fd', label: 'FD', icon: '🏦' },
  { id: 'goal', label: 'Goal Planner', icon: '🎯' },
  { id: 'emergency', label: 'Emergency Fund', icon: '🛟' },
  { id: 'budget', label: '50-30-20 Budget', icon: '🥧' }
];

document.getElementById('tabs').innerHTML = CALCULATORS.map((c, i) => `
  <button class="tab-btn ${i === 0 ? 'active' : ''}" data-tab="${c.id}">${c.icon} ${c.label}</button>
`).join('');

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  };
});

document.getElementById('panels').innerHTML = `
  <div class="panel active" id="panel-sip">${sipPanelHTML()}</div>
  <div class="panel" id="panel-fd">${fdPanelHTML()}</div>
  <div class="panel" id="panel-goal">${goalPanelHTML()}</div>
  <div class="panel" id="panel-emergency">${emergencyPanelHTML()}</div>
  <div class="panel" id="panel-budget">${budgetPanelHTML()}</div>
`;

/* ==================================================================
   1. SIP CALCULATOR
================================================================== */
function sipPanelHTML() {
  return `
    <div class="card">
      <h3>📈 SIP Calculator</h3>
      <div class="row3">
        <div class="field"><label>Monthly Investment (₹)</label><input type="number" id="sip-amount" value="10000"></div>
        <div class="field"><label>Expected Annual Return (%)</label><input type="number" id="sip-rate" value="12" step="0.1"></div>
        <div class="field"><label>Investment Period (years)</label><input type="number" id="sip-years" value="10"></div>
      </div>
      <button class="calc-btn" onclick="calcSIP()">Calculate</button>
      <div id="sip-result"></div>
    </div>
  `;
}
function calcSIP() {
  const P = Number(document.getElementById('sip-amount').value);
  const annualRate = Number(document.getElementById('sip-rate').value);
  const years = Number(document.getElementById('sip-years').value);
  const months = years * 12;
  const r = annualRate / 100 / 12;
  const FV = r === 0 ? P * months : P * (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
  const invested = P * months;
  const returns = FV - invested;

  document.getElementById('sip-result').innerHTML = `
    <div class="result-grid">
      <div class="result-tile"><div class="icon">💰</div><div class="num">${fmtINR(invested)}</div><div class="lbl">Total Invested</div></div>
      <div class="result-tile growth"><div class="icon">📊</div><div class="num">${fmtINR(returns)}</div><div class="lbl">Est. Returns</div></div>
      <div class="result-tile highlight"><div class="icon">🏆</div><div class="num">${fmtINR(FV)}</div><div class="lbl">Total Wealth</div></div>
    </div>
    <div class="chart-box"><canvas id="sip-chart"></canvas></div>
  `;

  // Year-by-year growth for the line chart
  const labels = [], values = [];
  for (let y = 1; y <= years; y++) {
    const m = y * 12;
    const fv = r === 0 ? P * m : P * (((Math.pow(1 + r, m) - 1) / r) * (1 + r));
    labels.push('Yr ' + y);
    values.push(Math.round(fv));
  }
  renderChart('sip-chart', {
    type: 'line',
    data: { labels, datasets: [{ label: 'Wealth Growth (₹)', data: values, borderColor: PALETTE.growth, backgroundColor: 'rgba(63,122,94,0.12)', fill: true, tension: 0.3 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => fmtINR(v) } } } }
  });

  addToHistory('SIP', `${fmtINR(P)}/mo for ${years}y at ${annualRate}% → ${fmtINR(FV)}`);
}

/* ==================================================================
   2. FD CALCULATOR
================================================================== */
function fdPanelHTML() {
  return `
    <div class="card">
      <h3>🏦 FD Calculator</h3>
      <div class="row3">
        <div class="field"><label>Deposit Amount (₹)</label><input type="number" id="fd-amount" value="100000"></div>
        <div class="field"><label>Interest Rate (% p.a.)</label><input type="number" id="fd-rate" value="7" step="0.1"></div>
        <div class="field"><label>Time (years)</label><input type="number" id="fd-years" value="5" step="0.5"></div>
      </div>
      <button class="calc-btn" onclick="calcFD()">Calculate</button>
      <div id="fd-result"></div>
    </div>
  `;
}
function calcFD() {
  const P = Number(document.getElementById('fd-amount').value);
  const annualRate = Number(document.getElementById('fd-rate').value);
  const years = Number(document.getElementById('fd-years').value);
  const r = annualRate / 100;
  const n = 4; // quarterly compounding, standard for Indian FDs
  const maturity = P * Math.pow(1 + r / n, n * years);
  const interest = maturity - P;

  document.getElementById('fd-result').innerHTML = `
    <div class="result-grid">
      <div class="result-tile"><div class="icon">💵</div><div class="num">${fmtINR(P)}</div><div class="lbl">Principal</div></div>
      <div class="result-tile growth"><div class="icon">📈</div><div class="num">${fmtINR(interest)}</div><div class="lbl">Interest Earned</div></div>
      <div class="result-tile highlight"><div class="icon">🏆</div><div class="num">${fmtINR(maturity)}</div><div class="lbl">Maturity Amount</div></div>
    </div>
    <div class="chart-box"><canvas id="fd-chart"></canvas></div>
  `;
  renderChart('fd-chart', {
    type: 'bar',
    data: { labels: ['Principal', 'Interest Earned'], datasets: [{ data: [P, interest], backgroundColor: [PALETTE.ink, PALETTE.brass] }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => fmtINR(v) } } } }
  });

  addToHistory('FD', `${fmtINR(P)} for ${years}y at ${annualRate}% → ${fmtINR(maturity)}`);
}

/* ==================================================================
   3. GOAL PLANNER
================================================================== */
function goalPanelHTML() {
  return `
    <div class="card">
      <h3>🎯 Goal Planner</h3>
      <div class="row2">
        <div class="field"><label>Goal Name</label><input type="text" id="goal-name" value="House Down Payment"></div>
        <div class="field"><label>Goal Amount (₹)</label><input type="number" id="goal-amount" value="1500000"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Years to Goal</label><input type="number" id="goal-years" value="7"></div>
        <div class="field"><label>Expected Annual Return (%)</label><input type="number" id="goal-rate" value="11" step="0.1"></div>
      </div>
      <button class="calc-btn" onclick="calcGoal()">Calculate</button>
      <div id="goal-result"></div>
    </div>
  `;
}
function calcGoal() {
  const name = document.getElementById('goal-name').value || 'Your Goal';
  const target = Number(document.getElementById('goal-amount').value);
  const years = Number(document.getElementById('goal-years').value);
  const annualRate = Number(document.getElementById('goal-rate').value);
  const months = years * 12;
  const r = annualRate / 100 / 12;
  const factor = r === 0 ? months : (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
  const requiredMonthly = target / factor;
  const totalInvested = requiredMonthly * months;
  const gain = target - totalInvested;

  document.getElementById('goal-result').innerHTML = `
    <div class="result-grid">
      <div class="result-tile highlight"><div class="icon">🎯</div><div class="num">${fmtINR(requiredMonthly)}</div><div class="lbl">Required / Month</div></div>
      <div class="result-tile"><div class="icon">💰</div><div class="num">${fmtINR(totalInvested)}</div><div class="lbl">Total Invested</div></div>
      <div class="result-tile growth"><div class="icon">📊</div><div class="num">${fmtINR(gain)}</div><div class="lbl">Growth Earned</div></div>
    </div>
    <div class="chart-box"><canvas id="goal-chart"></canvas></div>
  `;

  const labels = [], values = [];
  for (let y = 1; y <= years; y++) {
    const m = y * 12;
    const fv = r === 0 ? requiredMonthly * m : requiredMonthly * (((Math.pow(1 + r, m) - 1) / r) * (1 + r));
    labels.push('Yr ' + y);
    values.push(Math.round(fv));
  }
  renderChart('goal-chart', {
    type: 'line',
    data: { labels, datasets: [{ label: name, data: values, borderColor: PALETTE.brass, backgroundColor: 'rgba(184,134,58,0.12)', fill: true, tension: 0.3 }] },
    options: { plugins: { legend: { display: true, labels: { color: PALETTE.ink } } }, scales: { y: { ticks: { callback: v => fmtINR(v) } } } }
  });

  addToHistory('Goal Planner', `${name}: ${fmtINR(target)} in ${years}y → ${fmtINR(requiredMonthly)}/mo needed`);
}

/* ==================================================================
   4. EMERGENCY FUND CALCULATOR
================================================================== */
function emergencyPanelHTML() {
  return `
    <div class="card">
      <h3>🛟 Emergency Fund Calculator</h3>
      <div class="field"><label>Monthly Expenses (₹)</label><input type="number" id="emg-expenses" value="25000"></div>
      <button class="calc-btn" onclick="calcEmergency()">Calculate</button>
      <div id="emg-result"></div>
    </div>
  `;
}
function calcEmergency() {
  const expenses = Number(document.getElementById('emg-expenses').value);
  const target6 = expenses * 6;
  const target3 = expenses * 3;
  const monthlyToBuildIn12 = target6 / 12;

  document.getElementById('emg-result').innerHTML = `
    <div class="result-grid">
      <div class="result-tile"><div class="icon">🛟</div><div class="num">${fmtINR(target3)}</div><div class="lbl">Minimum (3 mo)</div></div>
      <div class="result-tile highlight"><div class="icon">🛡️</div><div class="num">${fmtINR(target6)}</div><div class="lbl">Recommended (6 mo)</div></div>
      <div class="result-tile growth"><div class="icon">📅</div><div class="num">${fmtINR(monthlyToBuildIn12)}</div><div class="lbl">Per Month (12-mo plan)</div></div>
    </div>
    <div class="chart-box"><canvas id="emg-chart"></canvas></div>
  `;
  renderChart('emg-chart', {
    type: 'bar',
    data: { labels: ['3-Month Buffer', '6-Month Buffer'], datasets: [{ data: [target3, target6], backgroundColor: [PALETTE.line, PALETTE.growth] }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => fmtINR(v) } } } }
  });

  addToHistory('Emergency Fund', `Expenses ${fmtINR(expenses)}/mo → target ${fmtINR(target6)} (6 months)`);
}

/* ==================================================================
   5. BUDGET PLANNER (50-30-20 rule)
================================================================== */
function budgetPanelHTML() {
  return `
    <div class="card">
      <h3>🥧 50-30-20 Budget Planner</h3>
      <div class="field"><label>Monthly Income (₹)</label><input type="number" id="budget-income" value="50000"></div>
      <button class="calc-btn" onclick="calcBudget()">Calculate</button>
      <div id="budget-result"></div>
    </div>
  `;
}
function calcBudget() {
  const income = Number(document.getElementById('budget-income').value);
  const needs = income * 0.5;
  const wants = income * 0.3;
  const savings = income * 0.2;

  document.getElementById('budget-result').innerHTML = `
    <div class="result-grid">
      <div class="result-tile"><div class="icon">🏠</div><div class="num">${fmtINR(needs)}</div><div class="lbl">Needs (50%)</div></div>
      <div class="result-tile"><div class="icon">🎬</div><div class="num">${fmtINR(wants)}</div><div class="lbl">Wants (30%)</div></div>
      <div class="result-tile growth"><div class="icon">🐖</div><div class="num">${fmtINR(savings)}</div><div class="lbl">Savings (20%)</div></div>
    </div>
    <div class="chart-box"><canvas id="budget-chart"></canvas></div>
  `;
  renderChart('budget-chart', {
    type: 'pie',
    data: { labels: ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'], datasets: [{ data: [needs, wants, savings], backgroundColor: [PALETTE.ink, PALETTE.brass, PALETTE.growth] }] },
    options: { plugins: { legend: { position: 'bottom', labels: { color: PALETTE.ink } } } }
  });

  addToHistory('Budget Planner', `Income ${fmtINR(income)} → Needs ${fmtINR(needs)} / Wants ${fmtINR(wants)} / Savings ${fmtINR(savings)}`);
}

/* ----------------------------------------------------------------
   Init
---------------------------------------------------------------- */
renderHistory();