const priceTests = {
  "1.79": [
    ["DTC Online", 61.7, 1.39, 0.77, 55.3], ["Retail/Grocery", 61.7, 1.02, 0.40, 39.2], ["Gym & Office", 61.7, 1.43, 0.81, 56.7]
  ],
  "2.19": [
    ["DTC Online", 51.7, 1.78, 1.16, 65.1], ["Retail/Grocery", 51.7, 1.25, 0.63, 50.3], ["Gym & Office", 51.7, 1.75, 1.13, 64.6]
  ],
  "2.59": [
    ["DTC Online", 26.7, 2.16, 1.54, 71.4], ["Retail/Grocery", 26.7, 1.48, 0.86, 58.0], ["Gym & Office", 26.7, 2.07, 1.45, 70.1]
  ]
};

const economics = [
  ["DTC Online", "2.9% payment processing + €0.35 fulfillment", 1.78, 1.16],
  ["Retail/Grocery", "35% retailer margin + 8% distributor cut", 1.25, 0.63],
  ["Gym & Office", "20% retailer margin", 1.75, 1.13]
];

// Observed competitor price bands across channel and format rows in Exhibit 2.
const competitors = [
  ["PulsUp", "Mass market", 0.96, 1.28],
  ["Mate Libre", "Heritage / loyal niche", 1.37, 1.83],
  ["VoltFit", "Premium performance", 2.10, 2.72],
  ["Root & Rise", "Boutique adaptogenic", 2.54, 3.11]
];
const positionNotes = {
  "1.79": "€1.79 lands above PulsUp but inside Mate Libre’s observed range: closer to mass-market accessibility than premium performance.",
  "2.19": "€2.19 sits at the entry point of VoltFit’s premium-performance range—premium enough to signal quality, without entering Root & Rise’s boutique tier.",
  "2.59": "€2.59 sits inside both VoltFit’s premium-performance and Root & Rise’s boutique-adaptogenic ranges: an unmistakably premium shelf signal."
};
const chartMin = 0.8;
const chartMax = 3.2;

const scenarios = {
  "1.79": {
    title: "€1.79 is an access-first launch, not a payback-first one",
    copy: "This price maximises estimated acceptance, but its thin per-unit contribution means the CMO’s premium signal and the CFO’s fast-payback objective are both compromised. It is best used only if early trial volume is the priority.",
    stakeholder: "Neither goal cleanly", note: "access and trial are prioritised", marker: "45%",
    tradeoff: "The lowest price brings the largest stated acceptance estimate (61.7%), yet leaves only €0.40 per retail unit after costs in Retail/Grocery. More customers saying yes does not automatically mean marketing pays back faster.",
    giveUp: "Premium positioning and unit-margin headroom."
  },
  "2.19": {
    title: "€2.19 through DTC Online + Gym & Office",
    copy: "This is the balanced recommendation: it retains a credible premium cue while concentrating early launch in the two channels with the strongest €1.16 and €1.13 estimated unit contribution. It leans toward Elena’s payback discipline without fully giving up Jonas’s premium positioning.",
    stakeholder: "CFO-leaning", note: "without abandoning premium cues", marker: "67%",
    tradeoff: "At €2.19, estimated acceptance falls to 51.7%, but channel contribution rises materially versus €1.79. DTC and Gym & Office preserve more net revenue for LUMEN than Retail/Grocery, creating a more defensible early payback case.",
    giveUp: "Some top-of-funnel acceptance versus the €1.79 access play."
  },
  "2.59": {
    title: "€2.59 is a premium-positioning bet",
    copy: "This selection most clearly favours Jonas’s premium positioning: it sits alongside the premium competitive set and has the strongest per-unit contribution. The cost is sharp: estimated acceptance drops to 26.7%, making early scale and confidence in marketing payback materially harder to defend.",
    stakeholder: "CMO-leaning", note: "premium price signal first", marker: "25%",
    tradeoff: "The €2.59 price earns the highest unit contribution in every channel, including €1.54 through DTC. Yet its estimated acceptance is nearly half the €2.19 case and less than half the €1.79 case, increasing launch-volume risk.",
    giveUp: "Broad early adoption and a lower-risk payback path."
  }
};

const seasonality = [78,80,88,98,118,132,138,128,104,90,82,76];
const months = ["J","F","M","A","M","J","J","A","S","O","N","D"];
const euro = value => `€${value.toFixed(2)}`;

function renderEconomics() {
  document.querySelector("#economics-cards").innerHTML = economics.map(([channel, cuts, net, contribution]) => `
    <div class="econ-card"><div><strong>${channel}</strong><span>${cuts}</span></div><div><span>Net to LUMEN</span><strong>${euro(net)}</strong></div><div><span>Unit contribution</span><b>${euro(contribution)}</b></div></div>`).join("");
}

function renderSeasonality() {
  document.querySelector("#seasonality-bars").innerHTML = seasonality.map((value, index) => `<div class="bar ${value >= 132 ? "peak" : ""}" style="height:${value / 1.38}%"><span>${months[index]}</span></div>`).join("");
}

function chartPosition(value) {
  return ((value - chartMin) / (chartMax - chartMin)) * 100;
}

function renderPositioning(price) {
  document.querySelector("#positioning-intro").textContent = positionNotes[price];
  document.querySelector("#positioning-chart").innerHTML = `
    <div class="lumen-marker" data-price="€${price}" style="left:${chartPosition(Number(price))}%"></div>
    ${competitors.map(([name, positioning, low, high]) => `<div class="competitor-row"><span class="competitor-name">${name} <small>· ${positioning}</small></span><i class="price-band" data-range="€${low.toFixed(2)}–€${high.toFixed(2)}" style="left:${chartPosition(low)}%;width:${chartPosition(high) - chartPosition(low)}%"></i></div>`).join("")}`;
}

function selectPrice(price) {
  const rows = priceTests[price];
  const scenario = scenarios[price];
  const best = rows.reduce((winner, row) => row[3] > winner[3] ? row : winner, rows[0]);
  document.querySelectorAll(".price-option").forEach(button => {
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
  document.querySelector("#recommendation-title").textContent = scenario.title;
  document.querySelector("#recommendation-copy").textContent = scenario.copy;
  document.querySelector("#tradeoff-heading").textContent = scenario.stakeholder;
  document.querySelector("#tradeoff-copy").textContent = scenario.tradeoff;
  document.querySelector("#give-up-copy").textContent = scenario.giveUp;
  document.querySelector("#balance-marker").style.setProperty("--marker", scenario.marker);
  document.querySelector("#price-test-rows").innerHTML = rows.map(([channel, acceptance, net, contribution, margin]) => `<tr><td>${channel}</td><td>${acceptance.toFixed(1)}%</td><td>${euro(net)}</td><td><strong>${euro(contribution)}</strong></td><td>${margin.toFixed(1)}%</td></tr>`).join("");
  renderPositioning(price);
}

document.querySelectorAll(".price-option").forEach(button => button.addEventListener("click", () => selectPrice(button.dataset.price)));
renderEconomics();
renderSeasonality();
selectPrice("2.19");
