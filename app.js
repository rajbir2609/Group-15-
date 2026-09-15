const economics = [
  ["DTC Online", "2.9% payment processing + €0.35 fulfillment", 1.78, 1.16],
  ["Retail/Grocery", "35% retailer margin + 8% distributor cut", 1.25, 0.63],
  ["Gym & Office", "20% retailer margin", 1.75, 1.13]
];

const scenarios = {
  "1.79": {
    title: "€1.79 is an access-first launch, not a payback-first one",
    copy: "This price maximises estimated acceptance, but its thin per-unit contribution means the CMO’s premium signal and the CFO’s fast-payback objective are both compromised. It is best used only if early trial volume is the priority.",
    stakeholder: "Neither goal cleanly", note: "access and trial are prioritised", marker: "45%",
    tradeoff: "The lowest price brings the largest stated acceptance estimate, yet leaves only a thin per-unit contribution after retailer cuts. More customers saying yes does not automatically mean marketing pays back faster.",
    giveUp: "Premium positioning and unit-margin headroom."
  },
  "2.19": {
    title: "€2.19 through the selected channel",
    copy: "This is the balanced recommendation: it retains a credible premium cue while leaving more unit contribution than the access price. It leans toward Elena’s payback discipline without fully giving up Jonas’s premium positioning.",
    stakeholder: "CFO-leaning", note: "without abandoning premium cues", marker: "67%",
    tradeoff: "At €2.19, estimated acceptance is lower than the access price, but channel contribution rises materially. That creates a more defensible early payback case than €1.79 without jumping to the sharp acceptance drop at €2.59.",
    giveUp: "Some top-of-funnel acceptance versus the €1.79 access play."
  },
  "2.59": {
    title: "€2.59 is a premium-positioning bet",
    copy: "This selection most clearly favours Jonas’s premium positioning: it sits alongside the premium competitive set and has the strongest per-unit contribution. The cost is sharp: estimated acceptance drops, making early scale and confidence in marketing payback materially harder to defend.",
    stakeholder: "CMO-leaning", note: "premium price signal first", marker: "25%",
    tradeoff: "The €2.59 price earns the highest unit contribution in every channel. Yet its estimated acceptance is nearly half the €2.19 case, increasing launch-volume risk.",
    giveUp: "Broad early adoption and a lower-risk payback path."
  }
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTERS = [
  { id: "Q1", label: "Q1 · Jan–Mar", months: [1, 2, 3] },
  { id: "Q2", label: "Q2 · Apr–Jun", months: [4, 5, 6] },
  { id: "Q3", label: "Q3 · Jul–Sep", months: [7, 8, 9] },
  { id: "Q4", label: "Q4 · Oct–Dec", months: [10, 11, 12] }
];
const TARGET_RATIO = 3;
const chartMin = 0.8;
const chartMax = 3.2;
const euro = (value) => `€${Number(value).toFixed(2)}`;
const money = new Intl.NumberFormat("en-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat("en-DE");
const percentage = (value) => `${(value * 100).toFixed(value < 0.01 ? 2 : 1)}%`;

const state = { price: "2.19", channel: "", timing: "" };
let cockpitData = null;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += char; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...values] = rows;
  return values.map((valuesRow) => Object.fromEntries(headers.map((header, index) => [header.trim(), valuesRow[index] ?? ""])));
}

async function loadCockpitData() {
  if (cockpitData) return cockpitData;
  const files = {
    competitors: "data/competitor_prices_by_channel.csv",
    funnel: "data/marketing_funnel_monthly.csv",
    costs: "data/cost_breakdown.csv",
    seasonality: "data/seasonality_and_weather.csv",
    quotes: "data/customer_quotes.csv",
    survey: "data/customer_survey.csv",
    priceTests: "data/price_test_results.csv"
  };
  const entries = await Promise.all(Object.entries(files).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}. Serve the folder over HTTP rather than opening the file directly.`);
    return [key, parseCsv(await response.text())];
  }));
  const raw = Object.fromEntries(entries);
  cockpitData = buildCockpitData(raw);
  return cockpitData;
}

function buildCockpitData(raw) {
  const competitors = [];
  raw.competitors.forEach((row) => {
    const price = Number(row.price_eur);
    let brand = competitors.find((item) => item.name === row.competitor);
    if (!brand) {
      brand = { name: row.competitor, positioning: row.positioning, low: price, high: price };
      competitors.push(brand);
    }
    brand.low = Math.min(brand.low, price);
    brand.high = Math.max(brand.high, price);
  });

  const funnelByChannel = new Map();
  raw.funnel.forEach((row) => {
    if (!funnelByChannel.has(row.channel)) funnelByChannel.set(row.channel, []);
    funnelByChannel.get(row.channel).push(row);
  });
  const channels = [...funnelByChannel.keys()];
  const funnel = Object.fromEntries(channels.map((channel) => [channel, aggregateFunnel(funnelByChannel.get(channel))]));

  const priceTests = {};
  raw.priceTests.forEach((row) => {
    const price = Number(row.price_eur).toFixed(2);
    if (!priceTests[price]) priceTests[price] = [];
    priceTests[price].push([
      row.channel,
      Number(row.estimated_acceptance_pct_of_survey),
      Number(row.net_price_to_lumen_eur),
      Number(row.unit_contribution_eur),
      Number(row.contribution_margin_pct)
    ]);
  });

  const seasonality = raw.seasonality.map((row) => ({
    month: Number(row.month),
    label: MONTHS[Number(row.month) - 1],
    index: Number(row.seasonality_index_100_avg),
    temp: Number(row.avg_temp_germany_celsius)
  }));

  const surveyBySegment = new Map();
  raw.survey.forEach((row) => {
    const segment = row.segment;
    if (!surveyBySegment.has(segment)) surveyBySegment.set(segment, { n: 0, sens: 0, intent: 0, spend: 0 });
    const stats = surveyBySegment.get(segment);
    stats.n += 1;
    stats.sens += Number(row.price_sensitivity_1_10);
    stats.intent += Number(row.lumen_purchase_intent_1_10);
    stats.spend += Number(row.monthly_beverage_spend_eur);
  });
  const survey = Object.fromEntries([...surveyBySegment.entries()].map(([segment, stats]) => [segment, {
    n: stats.n,
    sens: stats.sens / stats.n,
    intent: stats.intent / stats.n,
    spend: stats.spend / stats.n
  }]));

  const quotesBySegment = new Map();
  raw.quotes.forEach((row) => {
    if (!quotesBySegment.has(row.segment)) quotesBySegment.set(row.segment, []);
    quotesBySegment.get(row.segment).push(row);
  });

  return { competitors, channels, funnel, priceTests, seasonality, survey, quotesBySegment, costs: raw.costs };
}

function aggregateFunnel(rows) {
  const total = (key) => rows.reduce((sum, row) => sum + Number(row[key]), 0);
  const reach = total("reach");
  const engagements = total("engagements");
  const conversions = total("conversions_customers_acquired");
  const spend = total("spend_eur");
  const cac = spend / conversions;
  const ltv = rows.reduce((sum, row) => sum + Number(row.ltv_estimate_eur) * Number(row.conversions_customers_acquired), 0) / conversions;
  const months = rows.map((row) => row.month).sort();
  return { reach, engagements, conversions, spend, cac, ltv, ratio: ltv / cac, months: rows.length, from: months[0], to: months[months.length - 1] };
}

function chartPosition(value) {
  return ((value - chartMin) / (chartMax - chartMin)) * 100;
}

function describePosition(price, competitors) {
  const p = Number(price);
  const floor = competitors[0].low;
  const ceiling = competitors[competitors.length - 1].high;
  const share = (p - floor) / (ceiling - floor);
  const pole = share < 0.4
    ? "closer to the mass-market end of the competitor set"
    : share < 0.65
      ? "in the middle of the set, leaning toward premium performance"
      : "closer to the premium end of the competitor set";
  const inside = competitors.filter((brand) => p >= brand.low && p <= brand.high).map((brand) => `${brand.name} (${brand.positioning})`);
  const overlap = inside.length
    ? `It sits inside ${inside.join(" and ")}.`
    : `It sits between ${competitors.filter((brand) => brand.high < p).map((brand) => brand.name).slice(-1)[0] || "the mass-market brands"} and ${competitors.find((brand) => brand.low > p)?.name || "the boutique tier"}.`;
  return `€${p.toFixed(2)} is ${pole}. ${overlap}`;
}

function renderEconomics() {
  document.querySelector("#economics-cards").innerHTML = economics.map(([channel, cuts, net, contribution]) => `
    <div class="econ-card"><div><strong>${channel}</strong><span>${cuts}</span></div><div><span>Net to LUMEN</span><strong>${euro(net)}</strong></div><div><span>Unit contribution</span><b>${euro(contribution)}</b></div></div>`).join("");
}

function renderPositioning(price) {
  const { competitors } = cockpitData;
  document.querySelector("#positioning-intro").textContent = describePosition(price, competitors);
  document.querySelector("#positioning-chart").innerHTML = `
    <div class="lumen-marker" data-price="€${price}" style="left:${chartPosition(Number(price))}%"></div>
    ${competitors.map((brand) => `<div class="competitor-row"><span class="competitor-name">${brand.name} <small>· ${brand.positioning}</small></span><i class="price-band" data-range="${euro(brand.low)}–${euro(brand.high)}" style="left:${chartPosition(brand.low)}%;width:${chartPosition(brand.high) - chartPosition(brand.low)}%"></i></div>`).join("")}`;
}

function renderChannel(channel) {
  const data = cockpitData.funnel[channel];
  const costs = cockpitData.costs;
  const engagementRate = data.engagements / data.reach;
  const conversionRate = data.conversions / data.engagements;
  const aboveTarget = data.ratio >= TARGET_RATIO;
  const statusCard = document.getElementById("status-card");
  statusCard.className = `status-card ${aboveTarget ? "above-target" : "below-target"}`;
  document.getElementById("ratio").textContent = `${data.ratio.toFixed(2)}:1`;
  document.getElementById("ratio-detail").innerHTML = aboveTarget
    ? `Above LUMEN’s 3:1 plan target by ${(data.ratio - TARGET_RATIO).toFixed(2)}x.`
    : `<b>${channel}</b> is <span class="bad">below the 3:1 target</span> by ${(TARGET_RATIO - data.ratio).toFixed(2)}x. The shortfall is shown, not rounded up.`;
  document.getElementById("status-pill").textContent = aboveTarget ? "Above 3:1 target" : "Below 3:1 target";
  document.getElementById("cac").textContent = money.format(data.cac);
  document.getElementById("ltv").textContent = money.format(data.ltv);
  document.getElementById("spend").textContent = money.format(data.spend);
  document.getElementById("reach").textContent = integer.format(data.reach);
  document.getElementById("engagements").textContent = integer.format(data.engagements);
  document.getElementById("conversions").textContent = integer.format(data.conversions);
  document.getElementById("engagement-rate").textContent = `${percentage(engagementRate)} of reach`;
  document.getElementById("conversion-step-rate").textContent = `${percentage(conversionRate)} of engagements`;
  document.querySelector(".engagement").style.setProperty("--engagement-width", `${Math.max(8, engagementRate * 140)}%`);
  document.querySelector(".conversion").style.setProperty("--conversion-width", `${Math.max(8, (data.conversions / data.reach) * 800)}%`);
  const cogs = costs.find((row) => row.cost_component.startsWith("TOTAL COGS"));
  const margin = costs.find((row) => row.cost_component.startsWith("[KPI"));
  document.getElementById("cogs").textContent = money.format(Number(cogs.cost_per_unit_eur));
  document.getElementById("gross-margin").textContent = `${Number(margin.cost_per_unit_eur).toFixed(0)}%`;
  document.getElementById("funnel-period").textContent = `${data.months} observed months (${data.from} to ${data.to}) from marketing_funnel_monthly.csv · unit COGS and home-market gross margin from cost_breakdown.csv.`;
}

function strongestQuarter(seasonality) {
  return QUARTERS
    .map((quarter) => {
      const rows = seasonality.filter((row) => quarter.months.includes(row.month));
      const avgIndex = rows.reduce((sum, row) => sum + row.index, 0) / rows.length;
      const avgTemp = rows.reduce((sum, row) => sum + row.temp, 0) / rows.length;
      const peak = rows.reduce((winner, row) => (row.index > winner.index ? row : winner));
      return { ...quarter, avgIndex, avgTemp, peak };
    })
    .sort((a, b) => b.avgIndex - a.avgIndex)[0];
}

function renderSeasonality() {
  const { seasonality } = cockpitData;
  const maxIndex = Math.max(...seasonality.map((row) => row.index));
  const maxTemp = Math.max(...seasonality.map((row) => row.temp));
  document.getElementById("seasonality-bars").innerHTML = seasonality.map((row) => `
    <div>
      <span style="height:${(row.index / maxIndex) * 100}%"></span>
      <i style="height:${(row.temp / maxTemp) * 100}%"></i>
      <b>${row.label}</b>
    </div>`).join("");
  const suggested = strongestQuarter(seasonality);
  const peak = seasonality.reduce((winner, row) => (row.index > winner.index ? row : winner));
  document.getElementById("suggested-window").textContent = suggested.id;
  document.getElementById("suggested-window-detail").innerHTML = `${suggested.peak.label} peak ${suggested.peak.index}<br />avg index ${suggested.avgIndex.toFixed(0)} · ${suggested.avgTemp.toFixed(0)}°C`;
  document.getElementById("seasonality-note").innerHTML = `Suggested launch window: <b>${suggested.label}</b>, because mean demand is strongest then (index ${suggested.avgIndex.toFixed(0)}) and ${peak.label} is the single highest month (${peak.index}) while German temperatures average about ${suggested.avgTemp.toFixed(0)}°C — a better trial climate than the sub-100 winter months. This is a reading of the 12-month pattern, not a claim that one week is “the” answer.`;
  const timing = document.getElementById("timing-select");
  timing.innerHTML = QUARTERS.map((quarter) => `<option value="${quarter.id}">${quarter.label}${quarter.id === suggested.id ? " · strongest on the data" : ""}</option>`).join("");
  timing.disabled = false;
  timing.value = state.timing || suggested.id;
  state.timing = timing.value;
}

function pickQuote(quotes) {
  return [...quotes].sort((a, b) => scoreQuote(b.quote) - scoreQuote(a.quote))[0];
}

function scoreQuote(text) {
  const t = text.toLowerCase();
  if (/hard no|overpay|paying more|2,50|2.50|budget/.test(t)) return 4;
  if (/habit|never try|sold out|doesn't move me/.test(t)) return 3;
  if (/price|paying/.test(t)) return 2;
  return 1;
}

function tensionNote(stats, quote) {
  const text = quote.quote.toLowerCase();
  const highSens = stats.sens >= 7;
  const lowSens = stats.sens <= 4.5;
  const highIntent = stats.intent >= 7.5;
  const priceHardNo = /hard no|overpay|budget|2,50|2.50/.test(text);
  const paysMore = /don't mind paying more|paying more/.test(text);
  const blocksTrial = /habit|never try|sold out|doesn't move me/.test(text);

  if (priceHardNo && highSens) {
    return { kind: "align", label: "No strong tension found", note: "Aligns — high stated price sensitivity matches the verbatim cap on what this segment will pay." };
  }
  if (paysMore && lowSens) {
    return { kind: "align", label: "No strong tension found", note: "Aligns — low survey price sensitivity matches willingness to pay more for clean ingredients." };
  }
  if (priceHardNo && !highSens) {
    return { kind: "conflict", label: "Conflict", note: "Conflict — the quote rejects premium pricing, but average survey price sensitivity is only moderate." };
  }
  if (blocksTrial && stats.intent >= 6) {
    return { kind: "conflict", label: "Conflict", note: "Conflict — survey purchase intent looks open, while the quote says habit or availability will block trial." };
  }
  if (highIntent && quote.sentiment === "negative") {
    return { kind: "conflict", label: "Conflict", note: "Conflict — mean purchase intent is high, but the quoted risk is not price — it is taste, clutter, or switching friction." };
  }
  return { kind: "align", label: "No strong tension found", note: "No strong tension found on price vs. intent for this pairing; treat the quote as colour, not a contradiction." };
}

function renderTension() {
  const segments = Object.keys(cockpitData.survey);
  document.getElementById("tension-grid").innerHTML = segments.map((segment) => {
    const stats = cockpitData.survey[segment];
    const quote = pickQuote(cockpitData.quotesBySegment.get(segment) || []);
    if (!quote) return "";
    const tension = tensionNote(stats, quote);
    return `<article class="${tension.kind}">
      <b>${segment}</b>
      <q>“${quote.quote}”</q>
      <p><strong>Survey (${stats.n} respondents):</strong> price sensitivity <b>${stats.sens.toFixed(1)}/10</b>, purchase intent <b>${stats.intent.toFixed(1)}/10</b>, monthly category spend €${stats.spend.toFixed(0)}.</p>
      <mark>${tension.note}</mark>
    </article>`;
  }).join("");
}

function selectPrice(price) {
  state.price = price;
  const rows = cockpitData.priceTests[price];
  const scenario = scenarios[price];
  const best = rows.reduce((winner, row) => (row[3] > winner[3] ? row : winner), rows[0]);
  document.querySelectorAll(".price-option").forEach((button) => {
    const selected = button.dataset.price === price;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-checked", selected);
  });
  document.querySelector("#selected-price").textContent = `€${price}`;
  document.querySelector("#acceptance").textContent = `${rows[0][1].toFixed(1)}%`;
  document.querySelector("#best-contribution").textContent = euro(best[3]);
  document.querySelector("#best-channel").textContent = `${best[0]} / Exhibit 11`;
  document.querySelector("#stakeholder").textContent = scenario.stakeholder;
  document.querySelector("#stakeholder-note").textContent = scenario.note;
  document.querySelector("#recommendation-title").textContent = `${scenario.title}`;
  document.querySelector("#recommendation-copy").textContent = scenario.copy;
  document.querySelector("#tradeoff-heading").textContent = scenario.stakeholder;
  document.querySelector("#tradeoff-copy").textContent = scenario.tradeoff;
  document.querySelector("#give-up-copy").textContent = scenario.giveUp;
  document.querySelector("#balance-marker").style.setProperty("--marker", scenario.marker);
  document.querySelector("#price-test-rows").innerHTML = rows.map(([channel, acceptance, net, contribution, margin]) => `<tr><td>${channel}</td><td>${acceptance.toFixed(1)}%</td><td>${euro(net)}</td><td><strong>${euro(contribution)}</strong></td><td>${margin.toFixed(1)}%</td></tr>`).join("");
  renderPositioning(price);
}

function notOptimisedParagraph(price, channel, funnel) {
  if (price === "2.59") {
    return `This choice deliberately does not optimise for Elena’s fast-payback brief. ${channel} still prints a ${funnel.ratio.toFixed(2)}:1 LTV:CAC against the 3:1 plan hurdle, and estimated acceptance nearly halves versus €1.79. Jonas gets the premium shelf neighbour he asked for; the CFO does not get a clean eighteen-month payback story.`;
  }
  if (price === "1.79") {
    return `This choice deliberately does not optimise for Jonas’s premium positioning next to VoltFit and Root & Rise. €1.79 sits nearer the mass-market/heritage bands, and thinner unit contribution makes Elena’s 3:1 target (${funnel.ratio.toFixed(2)}:1 on ${channel}) no easier to hit. We would be buying trial, not a premium Germany story.`;
  }
  return `This choice deliberately does not fully satisfy either side of Freya’s CMO/CFO tension. Jonas does not get the €2.59 boutique-adjacent price, and Elena does not get a channel that clears the 3:1 LTV:CAC target — ${channel} remains at ${funnel.ratio.toFixed(2)}:1 on the actual 18-month history. It is the visible compromise, not a number that quietly picks a side.`;
}

function generateMemo() {
  const price = state.price;
  const channel = state.channel;
  const timing = QUARTERS.find((quarter) => quarter.id === state.timing);
  const funnel = cockpitData.funnel[channel];
  const rows = cockpitData.priceTests[price];
  const acceptance = rows[0][1];
  const best = rows.reduce((winner, row) => (row[3] > winner[3] ? row : winner), rows[0]);
  const suggested = strongestQuarter(cockpitData.seasonality);
  const cogs = cockpitData.costs.find((row) => row.cost_component.startsWith("TOTAL COGS"));
  const wellness = cockpitData.survey["Urban Wellness Professionals"];
  const students = cockpitData.survey["Students & Budget-Conscious"];
  const position = describePosition(price, cockpitData.competitors);
  const timingLine = timing.id === suggested.id
    ? `${timing.label} matches the strongest quarter on Exhibit 12 (mean demand index ${suggested.avgIndex.toFixed(0)}, peak ${suggested.peak.label} at ${suggested.peak.index}).`
    : `${timing.label} is the window currently selected; Exhibit 12 still shows ${suggested.id} as the strongest quarter (peak ${suggested.peak.label} at index ${suggested.peak.index}).`;

  const body = [
    `To: Freya Lindqvist, Head of Growth`,
    `From: Strategy & Analytics`,
    `Re: Germany launch — price, channel, timing`,
    ``,
    `Recommendation. Launch LUMEN in Germany at €${price} through ${channel}, timed for ${timing.label}. ${position} Exhibit 11 puts estimated acceptance at ${acceptance.toFixed(1)}% at this price, with the strongest unit contribution on ${best[0]} (€${best[3].toFixed(2)}). That is the package we would actually take into tomorrow’s discussion: one shelf price, one first channel, one launch window, each tied to an exhibit rather than to a blended “answer.”`,
    ``,
    `Business case. Over the full 18 months in Exhibit 7, ${channel} delivered ${integer.format(funnel.reach)} reach, ${integer.format(funnel.engagements)} engagements and ${integer.format(funnel.conversions)} customers for ${money.format(funnel.spend)}. Blended CAC is ${money.format(funnel.cac)} against customer-weighted LTV of ${money.format(funnel.ltv)}, so LTV:CAC is ${funnel.ratio.toFixed(2)}:1 — below the 3:1 plan target, and not rounded. Exhibit 8 keeps the cost floor in view: total COGS is ${money.format(Number(cogs.cost_per_unit_eur))} per 330ml can and home-market blended gross margin is 30%. ${timingLine} On the German survey (Exhibit 4), Urban Wellness Professionals remain the most premium-ready audience (intent ${wellness.intent.toFixed(1)}/10, price sensitivity ${wellness.sens.toFixed(1)}/10); Students & Budget-Conscious sit at the other pole (sensitivity ${students.sens.toFixed(1)}/10). We are not pretending those two segments want the same can at the same price.`,
    ``,
    `What this does not optimise for. ${notOptimisedParagraph(price, channel, funnel)} Freya asked us not to hide that trade-off inside a single heroic number. This memo does not.`
  ].join("\n");

  const words = body.split(/\s+/).filter(Boolean).length;
  document.getElementById("memo-output").innerHTML = `<pre>${body}</pre><p class="word-count">${words} words</p>`;
  document.getElementById("footer-logic").innerHTML = `<strong>Current selection:</strong> €${price} · ${channel} · ${timing.label}. Generate the memo again after any change.`;
}

async function start() {
  try {
    cockpitData = await loadCockpitData();
    const channelSelect = document.getElementById("channel-select");
    channelSelect.innerHTML = cockpitData.channels.map((channel) => `<option value="${channel}">${channel}</option>`).join("");
    channelSelect.disabled = false;
    state.channel = channelSelect.value;
    renderEconomics();
    renderSeasonality();
    renderTension();
    selectPrice(state.price);
    renderChannel(state.channel);

    document.querySelectorAll(".price-option").forEach((button) => button.addEventListener("click", () => selectPrice(button.dataset.price)));
    channelSelect.addEventListener("change", () => {
      state.channel = channelSelect.value;
      renderChannel(state.channel);
    });
    document.getElementById("timing-select").addEventListener("change", (event) => {
      state.timing = event.target.value;
    });
    document.getElementById("memo-button").addEventListener("click", generateMemo);
  } catch (error) {
    document.getElementById("ratio-detail").textContent = error.message;
    document.getElementById("seasonality-note").textContent = error.message;
  }
}

start();
