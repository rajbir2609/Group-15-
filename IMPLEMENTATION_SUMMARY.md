# LUMEN Germany Launch Cockpit — Implementation Complete

## Project Overview
This is a fully functional decision-support tool for LUMEN's Germany market entry. It lets Freya (Head of Growth) explore three candidate retail prices, channel strategies, and launch timing — and generates a data-backed recommendation memo.

## Five Core Features — All Implemented

### 1. Positioning Chart (Dynamic, Price-Sensitive)
**File:** `app.js` — `renderPositioning()` function  
**Feature:** Shows LUMEN's three candidate prices (€1.79, €2.19, €2.59) against four competitors:
- PulsUp (mass market: €1.0–1.3)
- Mate Libre (heritage niche: €1.4–1.8)
- VoltFit (premium performance: €2.1–2.7)
- Root & Rise (boutique adaptogenic: €2.5–3.1)

**How it works:**
- Chart updates in real-time when price is selected
- Competitor bands are drawn from `competitor_prices_by_channel.csv`
- LUMEN's position is described narratively (e.g., "closer to the premium end")
- Tells user which competitors overlap with LUMEN's price point

**Data source:** Exhibit 2 (`competitor_prices_by_channel.csv`)

---

### 2. Channel Economics & LTV:CAC Funnel (Below-Target Flagging)
**File:** `app.js` — `renderChannel()` function  
**Feature:** When user selects a channel, displays:
- Reach → Engagements → Conversions (visual funnel)
- Blended CAC (Customer Acquisition Cost)
- Estimated LTV (Lifetime Value)
- **LTV:CAC ratio against 3:1 plan target**
- Status pill: "Above 3:1 target" (green) or "Below 3:1 target" (red, explicitly not hidden)

**Key detail:** The tool does NOT round up or hide below-target ratios. If a channel is at 2.4:1 against a 3:1 target, it shows exactly that — flagged in red as the shortfall.

**Data sources:** 
- Exhibit 7 (`marketing_funnel_monthly.csv`) — 18 months of actual reach/engagement/conversion data
- Exhibit 8 (`cost_breakdown.csv`) — unit COGS and blended gross margin (30%)

---

### 3. Seasonality & Weather Indicator (Recommended Launch Window)
**File:** `app.js` — `renderSeasonality()` function  
**Feature:** Shows 12 months of:
- Demand seasonality index (100 = average)
- Average German temperature
- Calculates which quarter (Q1–Q4) has strongest demand

**Recommendation logic:**
- Identifies the quarter with highest mean demand index
- Flags the single peak month
- Notes German temperature (trying to avoid sub-100 winter months for trial)
- User can override with a dropdown, but data-suggested quarter is marked

**Data source:** Exhibit 12 (`seasonality_and_weather.csv`)

---

### 4. Qual/Quant Tension Reconciliation (Customer Quotes vs. Survey)
**File:** `app.js` — `renderTension()` + `tensionNote()` functions  
**Feature:** For each customer segment (e.g., "Urban Wellness Professionals", "Students & Budget-Conscious"):
- Shows one representative quote from `customer_quotes.csv`
- Displays matching survey stats: price sensitivity (1–10), purchase intent (1–10), monthly spend
- Marks tension as **Aligned** or **Conflict** with one-line explanation

**Tension detection logic:**
- High stated price sensitivity (≥7) + quote saying "overpay"? → Aligns
- High purchase intent (≥7.5) + quote saying "habit will block me"? → Conflict
- Low survey price sensitivity + quote saying "paying more is fine"? → Aligns

**Data sources:**
- Exhibit 4 (`customer_survey.csv`) — segment-level aggregates
- Exhibit 5 (`customer_quotes.csv`) — verbatims per segment

---

### 5. Dynamic Recommendation Memo Generator
**File:** `app.js` — `generateMemo()` function  
**Feature:** Produces a one-page memo (250–350 words) that reads like something you'd send to Freya:
- **To/From/Re:** Headers
- **Recommendation:** The exact price, channel, timing currently selected
- **Business case:** Pulls real metrics:
  - Funnel stats (reach, engagements, conversions, spend)
  - CAC, LTV, and LTV:CAC ratio for the selected channel
  - Unit COGS and gross margin
  - Seasonality support for timing choice
  - Survey context (which segments are most premium-ready)
- **What this does NOT optimise for:** A paragraph explaining the CMO/CFO trade-off:
  - €2.59 = premium positioning, but lower acceptance & slower payback
  - €1.79 = max acceptance, but mass-market positioning & thin margins
  - €2.19 = visible compromise, optimises neither fully

**Key behaviour:**
- Memo updates **every time** you change price, channel, or timing
- Never hardcoded; always data-driven
- References Exhibits by number (Exhibit 7, Exhibit 11, etc.)
- Includes word count

---

## File Structure

```
├── index.html              # Cockpit UI (all sections & interactive controls)
├── styles.css              # Design tokens, grid, colour palette, responsive
├── app.js                  # Complete logic (429 lines)
│   ├── Data loading (CSV parser, fetch)
│   ├── Data aggregation (funnel, competitors, surveys)
│   ├── Rendering (all five features)
│   ├── State management (price, channel, timing)
│   └── Memo generation
├── data/                   # 12 CSV files (all Exhibits 1–12)
│   ├── competitor_prices_by_channel.csv
│   ├── price_test_results.csv
│   ├── marketing_funnel_monthly.csv
│   ├── cost_breakdown.csv
│   ├── seasonality_and_weather.csv
│   ├── customer_survey.csv
│   ├── customer_quotes.csv
│   ├── ... (+ 5 more)
└── README.md               # Original case brief and setup instructions
```

---

## How to Run Locally

```bash
# Option 1: Python
python3 -m http.server 8000
# Then open http://localhost:8000

# Option 2: Node.js (if you have npx)
npx http-server

# Option 3: Use any static server (PHP, Node, etc.)
# The app loads all CSV files via fetch(), so it must be served over HTTP
# (not file:// URLs)
```

---

## How to Deploy

The app is a **static site** — no backend, no database, no authentication:

1. **Netlify / Vercel:** Drag and drop the entire folder
2. **GitHub Pages:** Push to `main`, enable Pages in Settings
3. **Any static host:** Copy files, set root to this directory

The app will:
- Load 12 CSV files from the `data/` folder
- Parse them with a built-in CSV parser
- Render all sections dynamically
- Work in any modern browser

---

## Testing Checklist

- [x] **Price selector:** Click each of the three prices (€1.79, €2.19, €2.59)
  - Acceptance, contribution, channel table update
  - Positioning chart moves
  - Trade-off description changes
  
- [x] **Channel selector:** Pick each channel (DTC Online, Retail/Grocery, Gym & Office)
  - Funnel metrics update
  - LTV:CAC ratio updates and colours (green if ≥3:1, red if <3:1)
  
- [x] **Seasonality:** Review the 12-month bars + suggested quarter
  - Q2 or Q3 should be highlighted as strongest
  
- [x] **Qual/quant tension:** Scroll to the bottom section
  - At least 2 segments show (with quotes, survey stats, and conflict/align label)
  
- [x] **Memo generator:** Click "Generate recommendation"
  - Memo appears with your currently selected price, channel, timing
  - Change a selection and click again — memo updates
  - Memo is roughly 250–350 words

---

## Design Rationale

### Why this structure?
- **Single-page app:** No server needed, instant interactivity
- **CSV-based data:** Easy to update without rewriting code
- **Exhibits → Sections:** Each data file maps to one or more cockpit views
- **State-driven rendering:** Changing one selector re-renders only affected sections

### Why flag below-target LTV:CAC?
Freya specifically asked: "don't hide that trade-off inside a single heroic number." When a channel doesn't hit the 3:1 target, she needs to see it. The red flag isn't punishment — it's clarity.

### Why include seasonality + temperature?
Functional beverages see real seasonality. Warmer months and higher demand months overlap. Showing both lets the team talk about German weather as a factor in trial timing.

---

## Known Limitations

1. **No real German sales data:** All estimates come from price testing and home-market (NL/DK/SE) history. The tool is explicitly transparent about this.
2. **Customer names/emails not loaded:** `customer_survey.csv` includes name and email columns, but they're not exposed in the UI (privacy by design).
3. **No multi-scenario comparison:** The memo reflects one selection at a time, not side-by-side scenarios.
4. **Browser-only:** No offline mode or data export (not required by brief).

---

## What the Brief Asked For

> "Backing by something I can actually poke at — not another slide deck."

✅ Every claim in the memo is traceable to a CSV row  
✅ Every number updates as selections change  
✅ The trade-off is shown, not hidden  
✅ Segments and channels are visible, not blended away

---

## Next Steps (Optional Enhancements)

- Add live German weather API call (Exhibit 12 correlation)
- Build a "side-by-side scenario" view
- Add PDF export for the memo
- Connect to a CMS to let non-technical stakeholders update case parameters

None of these are required to launch.

---

## Questions?

The app is fully self-contained. No external dependencies, no API keys, no database. Just HTML, CSS, JavaScript, and CSV files.

To verify everything works: serve the folder over HTTP and click through all five sections. The memo should update dynamically as you change selections.
