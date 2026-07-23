/* ---------- helpers ---------- */
function inr(num){
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

/* ---------- risk chips ---------- */
let riskLevel = 'medium';
document.querySelectorAll('.chip').forEach(c=>{
  c.addEventListener('click', ()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    riskLevel = c.dataset.risk;
  });
});

/* ---------- ROADMAP GENERATOR ---------- */
function generateRoadmap(){
  const income = parseFloat(document.getElementById('income').value) || 0;
  const savings = parseFloat(document.getElementById('savings').value) || 0;
  const goal = document.getElementById('goal').value;
  const years = parseFloat(document.getElementById('years').value) || 1;

  const monthlyExpenseEstimate = income * 0.5;
  const emergencyTarget = monthlyExpenseEstimate * 6;
  const hasEmergencyFund = savings >= emergencyTarget;

  let cards = [];

  if(!hasEmergencyFund){
    const emergencyAlloc = Math.round(income * 0.15);
    cards.push({
      title: "Build your emergency fund first",
      desc: `Target: ${inr(emergencyTarget)} (6 months of expenses). Park this in a savings account or liquid fund — not locked instruments.`,
      amt: inr(emergencyAlloc) + "/mo"
    });
  }

  const taxSavingAlloc = Math.round(income * (riskLevel==='low' ? 0.20 : 0.12));
  cards.push({
    title: "PPF / EPF (tax-saving, safe)",
    desc: "Long-term, government-backed, tax-free returns. Good base layer of your portfolio.",
    amt: inr(taxSavingAlloc) + "/mo"
  });

  const sipPct = riskLevel==='high' ? 0.30 : riskLevel==='medium' ? 0.22 : 0.12;
  const sipAlloc = Math.round(income * sipPct);
  cards.push({
    title: "SIP in Mutual Funds (growth)",
    desc: `Based on your ${riskLevel} risk appetite — this is your long-term wealth engine.`,
    amt: inr(sipAlloc) + "/mo"
  });

  const goalLabels = {
    house: "Home down-payment goal",
    studies: "Higher studies fund",
    retirement: "Retirement corpus",
    wedding: "Wedding fund",
    emergency: "Safety net top-up"
  };
  const remainingPct = 1 - (hasEmergencyFund?0:0.15) - (riskLevel==='low'?0.20:0.12) - sipPct;
  const goalAlloc = Math.max(Math.round(income * Math.max(remainingPct, 0.08)), 500);
  cards.push({
    title: goalLabels[goal] + ` (${years}-yr goal)`,
    desc: "Dedicated FD or recurring deposit ladder timed to your goal horizon.",
    amt: inr(goalAlloc) + "/mo"
  });

  const out = document.getElementById('roadmapOutput');
  out.innerHTML = cards.map(c => `
    <div class="rm-card">
      <div><div class="rm-title">${c.title}</div><div class="rm-desc">${c.desc}</div></div>
      <div class="rm-amt">${c.amt}</div>
    </div>
  `).join('');
}

/* ---------- CALCULATOR TABS ---------- */
document.querySelectorAll('.calc-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.calc-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.calc-panel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

/* ---------- SIP CALC ---------- */
function calcSIP(){
  const P = parseFloat(document.getElementById('sipAmt').value) || 0;
  const annualRate = parseFloat(document.getElementById('sipRate').value) || 0;
  const years = parseFloat(document.getElementById('sipYears').value) || 0;
  const r = annualRate/100/12;
  const n = years*12;
  const fv = r===0 ? P*n : P * ((Math.pow(1+r,n)-1)/r) * (1+r);
  const invested = P*n;
  const gains = fv - invested;
  document.getElementById('sipInvested').innerText = inr(invested);
  document.getElementById('sipGains').innerText = inr(gains);
  document.getElementById('sipTotal').innerText = inr(fv);
}

/* ---------- FD CALC ---------- */
function calcFD(){
  const P = parseFloat(document.getElementById('fdAmt').value) || 0;
  const rate = parseFloat(document.getElementById('fdRate').value) || 0;
  const years = parseFloat(document.getElementById('fdYears').value) || 0;
  const n = 4; // quarterly compounding
  const total = P * Math.pow(1 + (rate/100)/n, n*years);
  document.getElementById('fdPrincipal').innerText = inr(P);
  document.getElementById('fdInterest').innerText = inr(total-P);
  document.getElementById('fdTotal').innerText = inr(total);
}

/* ---------- GOAL CALC ---------- */
function calcGoal(){
  const target = parseFloat(document.getElementById('goalAmt').value) || 0;
  const years = parseFloat(document.getElementById('goalYears').value) || 1;
  const annualRate = parseFloat(document.getElementById('goalRate').value) || 0;
  const r = annualRate/100/12;
  const n = years*12;
  const monthly = r===0 ? target/n : target / (((Math.pow(1+r,n)-1)/r) * (1+r));
  document.getElementById('goalMonthly').innerText = inr(monthly);
  document.getElementById('goalInvested').innerText = inr(monthly*n);
  document.getElementById('goalTarget').innerText = inr(target);
}
calcSIP(); calcFD(); calcGoal();

/* ---------- EDUCATION ACCORDION ---------- */
const eduItems = [
  {q:"What is a SIP?", a:"A Systematic Investment Plan — you invest a fixed amount every month into a mutual fund. Over time, market-linked growth and compounding build wealth, but returns aren't guaranteed."},
  {q:"What is a Fixed Deposit (FD)?", a:"You lock a lump sum with a bank for a fixed period at a fixed interest rate. Very safe, but returns barely beat inflation."},
  {q:"What is PPF?", a:"Public Provident Fund — a 15-year government savings scheme with tax-free interest (~7-7.5%). Great for long-term, safe, tax-saving money."},
  {q:"What is an emergency fund?", a:"3–6 months of your expenses, kept easily accessible (savings account or liquid fund) — not invested — so a sudden expense never forces you to break your investments."},
  {q:"SIP vs FD — which is better?", a:"FD is safer but grows slowly. SIP has more risk but historically higher long-term growth. Most beginners do both: FD/PPF for safety, SIP for growth."},
  {q:"Why does compounding matter?", a:"Compounding means your returns start earning their own returns. Starting early — even with a small amount — often beats starting late with a bigger amount."}
];
document.getElementById('accordion').innerHTML = eduItems.map((item,i)=>`
  <div class="acc-item" id="acc-${i}">
    <div class="acc-head" onclick="toggleAcc(${i})"><span>${item.q}</span><span class="plus">+</span></div>
    <div class="acc-body"><p>${item.a}</p></div>
  </div>
`).join('');
function toggleAcc(i){
  document.getElementById('acc-'+i).classList.toggle('open');
}

/* ---------- CHAT (rule-based fake AI) ---------- */
function toggleChat(){
  document.getElementById('chatPanel').classList.toggle('open');
}
function askChip(text){
  document.getElementById('chatInput').value = text;
  sendChat();
}
function sendChat(){
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text) return;
  const body = document.getElementById('chatBody');
  body.innerHTML += `<div class="msg user">${text}</div>`;
  input.value = '';
  const reply = getBotReply(text.toLowerCase());
  setTimeout(()=>{
    body.innerHTML += `<div class="msg bot">${reply}</div>`;
    body.scrollTop = body.scrollHeight;
  }, 400);
  body.scrollTop = body.scrollHeight;
}
function getBotReply(t){
  if(t.includes('sip') && t.includes('fd')) return "FD is safe but slow (~7%). SIP carries market risk but historically grows faster long-term (~12%). Most beginners use both: FD/PPF for safety, SIP for growth.";
  if(t.includes('emergency')) return "Aim for 3–6 months of expenses in a savings account or liquid fund — this is your safety net before you invest anywhere else.";
  if(t.includes('how much') && t.includes('save')) return "A common starting rule: 50% needs, 30% wants, 20% savings/investments. Adjust the split as your income grows.";
  if(t.includes('ppf')) return "PPF is a 15-year government scheme with tax-free interest around 7-7.5% — great for long-term, safe money, but it's locked in for a while.";
  if(t.includes('retire')) return "For retirement, longer timelines let you take more risk early (equity SIPs) and shift to safer instruments (PPF/FD) as you get closer.";
  if(t.includes('risk')) return "Low risk = FD/PPF. Medium = balanced mutual funds. High = equity SIPs. Your risk appetite should match your goal's timeline — longer timeline, more room for risk.";
  return "Good question! For this prototype demo, try asking about SIP vs FD, emergency funds, PPF, retirement, or how much to save.";
}