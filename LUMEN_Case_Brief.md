# LUMEN — Germany Market Entry Brief

*Internal — Confidential. LUMEN Strategy & Analytics.*
*To: Strategy & Analytics team — From: Freya Lindqvist, Head of Growth — Re: Germany market entry*

## Germany market entry — we need a price, a launch channel, and a timeline

LUMEN launched in Copenhagen in 2022: a low-sugar, sparkling functional drink built on natural
caffeine from green tea and a light adaptogen blend. We've spent three years earning our place on
shelves and screens in the Netherlands, Denmark and Sweden. Germany is next — Europe's largest
market for functional beverages, and the one every investor asks us about first.

| Metric | Value |
|---|---|
| German functional-beverage market, 2026 | €9.1bn |
| Category CAGR through 2033 | ~7% |
| Germany's share of European category value | ~35% |
| Established competitors already on German shelves | 4 |

### Why now

NL/DK/SE now generate roughly €3.2M in trailing revenue and the brand has real repeat-purchase
loyalty in Copenhagen and Amsterdam. Investors keep asking about Germany specifically — it's the
obvious next market, not an opportunistic one.

### Competitor landscape, at a glance

| Brand | Positioning | Price band |
|---|---|---|
| PulsUp | Mass market | €1.0–1.3 |
| Mate Libre | Heritage, loyal niche | €1.4–1.8 |
| VoltFit | Premium performance | €2.1–2.7 |
| Root & Rise | Boutique adaptogenic | €2.5–3.1 |

### Message — Slack #leadership-sync (today, 08:41)

> Quick context before you dig in, because you'll hit this tension in the data whether or not I
> flag it now. Jonas (CMO) wants us to launch positioned next to VoltFit and Root & Rise:
> clean-label story, premium shelf price, brand-building spend. Elena (CFO) is watching runway and
> wants a price and channel mix that pays back its marketing spend fast, not eighteen months from
> now. I don't think we can fully give both of them what they're asking for at the same time — and
> I'd rather you tell me where the real trade-off is than hand me a number that quietly picks a
> side.
>
> What I need: a recommendation on **price**, **positioning** and **which channel(s) to launch in
> first** for Germany, backed by something I can actually poke at — not another slide deck. Use
> whatever you need from the data room. Some of it comes from our home markets, not Germany itself,
> because we obviously don't have German sales yet — that's not a gap, that's the job.
>
> — Freya

### The decision

**At what price, through which channel(s), and roughly when should LUMEN launch in Germany — and
what are we deliberately choosing not to optimise for by picking it?**

---

## Exhibits — data appendix

Twelve files, in `data/`. Full detail and column-by-column notes are in `data/README_data.md` —
this section is a map, not a substitute for opening the files.

| Exhibit | File | Contents |
|---|---|---|
| 1 | `market_context.csv` | DE market size by sub-category & by region/city, 2022–27 |
| 2 | `competitor_prices_by_channel.csv` | 4 competitors × channel × pack format pricing |
| 3 | `competitor_price_history.csv` | 12 months of competitor price & promo activity |
| 4 | `customer_survey.csv` | ~420 German respondents: segment, spend, channel, awareness, intent |
| 5 | `customer_quotes.csv` | Qualitative verbatims by segment |
| 6 | `historical_sales_weekly.csv` | 78 weeks of actual sales, NL/DK/SE only |
| 7 | `marketing_funnel_monthly.csv` | 18 months, reach → engagement → conversion → CAC → LTV, by channel |
| 8 | `cost_breakdown.csv` | Per-unit cost structure & current blended gross margin |
| 9 | `channel_economics.csv` | What LUMEN nets per unit after retailer/distributor/payment cuts, by channel |
| 10 | `price_sensitivity_survey.csv` | ~300 respondents, 4 Van Westendorp price thresholds each |
| 11 | `price_test_results.csv` | 3 candidate prices × channel: acceptance & contribution margin |
| 12 | `seasonality_and_weather.csv` | Monthly demand seasonality index & avg. German temperature |

**Headline numbers**: blended CAC across all marketing channels ≈ **€44** (Exhibit 7) · current
blended gross margin, home markets ≈ **30%** (Exhibit 8) · target LTV:CAC ratio the plan assumes ≈
**3:1** (Exhibit 7) · 3 candidate launch prices to evaluate (Exhibit 11).

| Price | Est. acceptance | Contribution / unit | Range across channels (Exhibit 11) |
|---|---|---|---|
| €1.79 | 61.7% | €0.40–€0.81 | Best acceptance, thinnest margin |
| €2.19 | 51.7% | €0.63–€1.16 | Balanced acceptance/margin trade-off |
| €2.59 | 26.7% | €0.86–€1.54 | Best margin, acceptance nearly halves |

**Worth knowing going in**: the three candidate prices are reported **per channel, not blended** —
the channel mix for Germany is one of the calls we're asking you to make, so we didn't pre-bake it
into "the answer." Some data is imperfect on purpose; treat it the way you would a real export, not
a textbook table.

**Optional, not required**: if your team wants to push further, nothing stops you pulling in a live
public data source (e.g. current German weather) and correlating it with Exhibit 12. A genuinely
harder stretch: reconcile Exhibit 5's qualitative quotes against Exhibit 4's quantitative survey
where they seem to disagree.

## Stuck? Tool ideas to start from

A menu, not a checklist — pick one, combine a few, or use these to trigger a better idea of your own.

- **Pricing simulator** — price → volume & margin trade-off
- **Positioning map** — LUMEN vs. competitors, price × perception
- **Marketing ROI simulator** — budget by channel → CAC, payback, LTV
- **City launch prioritiser** — which German region to enter first
- **Risk / scenario simulator** — range of outcomes, not one number
- **Decision cockpit** — combine several of these into one view
- **Qual/quant reconciler** — where the quotes and the survey disagree
- **Launch-timing indicator** — seasonality + competitor activity → when
- **Recommendation memo generator** — turns your inputs into a one-page write-up

*(A rendered, laid-out version of this brief is also available as `LUMEN_Case_Brief.pdf` in this repo.)*
