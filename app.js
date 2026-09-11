const money = new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat('en-DE');
const percentage = (value) => `${(value * 100).toFixed(value < 0.01 ? 2 : 1)}%`;

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { cell += char; i += 1; } else quoted = !quoted; }
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i += 1; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...values] = rows;
  return values.map((valuesRow) => Object.fromEntries(headers.map((header, index) => [header, valuesRow[index] ?? ''])));
}

function aggregate(rows) {
  const total = (key) => rows.reduce((sum, row) => sum + Number(row[key]), 0);
  const reach = total('reach'); const engagements = total('engagements'); const conversions = total('conversions_customers_acquired'); const spend = total('spend_eur');
  const cac = spend / conversions;
  const ltv = rows.reduce((sum, row) => sum + Number(row.ltv_estimate_eur) * Number(row.conversions_customers_acquired), 0) / conversions;
  return { reach, engagements, conversions, spend, cac, ltv, ratio: ltv / cac };
}

function setText(id, value) { document.getElementById(id).textContent = value; }

function renderChannel(name, rows, costs) {
  const data = aggregate(rows);
  const engagementRate = data.engagements / data.reach;
  const conversionRate = data.conversions / data.engagements;
  const overallConversion = data.conversions / data.reach;
  const aboveTarget = data.ratio >= 3;
  const statusCard = document.getElementById('status-card');
  statusCard.className = `status-card ${aboveTarget ? 'above-target' : 'below-target'}`;
  setText('ratio', `${data.ratio.toFixed(2)}:1`);
  setText('ratio-detail', aboveTarget ? `Above LUMEN’s 3:1 target by ${(data.ratio - 3).toFixed(2)}x.` : `Below LUMEN’s 3:1 target by ${(3 - data.ratio).toFixed(2)}x — this channel does not meet the payback hurdle.`);
  setText('status-pill', aboveTarget ? 'Above target' : 'Below 3:1 target');
  setText('cac', money.format(data.cac)); setText('ltv', money.format(data.ltv)); setText('spend', money.format(data.spend)); setText('customer-count', `${integer.format(data.conversions)} customers acquired`);
  setText('reach', integer.format(data.reach)); setText('engagements', integer.format(data.engagements)); setText('conversions', integer.format(data.conversions));
  setText('engagement-rate', `${percentage(engagementRate)} of reach`); setText('conversion-step-rate', `${percentage(conversionRate)} of engagements`); setText('conversion-rate', `${percentage(overallConversion)} reach → customer`);
  document.querySelector('.engagement').style.setProperty('--engagement-width', `${Math.max(3, engagementRate * 100)}%`);
  document.querySelector('.conversion').style.setProperty('--conversion-width', `${Math.max(3, overallConversion * 100)}%`);
  const cogs = costs.find((row) => row.cost_component.startsWith('TOTAL COGS'));
  const margin = costs.find((row) => row.cost_component.startsWith('[KPI'));
  setText('cogs', money.format(Number(cogs.cost_per_unit_eur))); setText('gross-margin', `${Number(margin.cost_per_unit_eur).toFixed(0)}%`);
  setText('period', `${rows.length} observed months · ${rows[0].month} to ${rows.at(-1).month}`);
}

async function start() {
  try {
    const [funnelResponse, costResponse] = await Promise.all([fetch('data/marketing_funnel_monthly.csv'), fetch('data/cost_breakdown.csv')]);
    if (!funnelResponse.ok || !costResponse.ok) throw new Error('Data files could not be loaded.');
    const [funnel, costs] = await Promise.all([funnelResponse.text(), costResponse.text()]);
    const rows = parseCsv(funnel); const costRows = parseCsv(costs);
    const channels = [...new Set(rows.map((row) => row.channel))]; const select = document.getElementById('channel-select');
    select.innerHTML = channels.map((channel) => `<option value="${channel}">${channel}</option>`).join(''); select.disabled = false;
    const update = () => renderChannel(select.value, rows.filter((row) => row.channel === select.value), costRows);
    select.addEventListener('change', update); update();
  } catch (error) {
    document.getElementById('ratio-detail').textContent = error.message;
    document.getElementById('status-pill').textContent = 'Data error';
  }
}
start();
