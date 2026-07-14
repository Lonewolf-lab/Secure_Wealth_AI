"""
Secure Wealth Twin — Synthetic Market Trend Dataset Generator
==================================================================
Generates illustrative daily time-series data for three market indicators
the Wealth Manager tracks (per architecture blueprint Section A):
  - Stocks: a Nifty-like broad equity index level
  - Gold: price per 10g in INR
  - Inflation: year-on-year CPI %, smoothly interpolated to daily

This is SYNTHETIC data designed to have realistic trend + seasonality +
noise structure so Prophet has genuine signal to learn from — it is NOT
real historical market data and should never be presented as such in a
demo. The point is to prove the forecasting PIPELINE works correctly;
swapping in a real data feed (e.g. NSE/BSE API, RBI inflation data) later
requires no changes to the forecasting code itself, only this generator.
"""

import numpy as np
import pandas as pd

RANDOM_SEED = 42
N_YEARS = 3
OUTPUT_FILE = "market_trends_data.csv"

rng = np.random.default_rng(RANDOM_SEED)

END_DATE = pd.Timestamp("2026-07-09")  # "today" in this project's timeline
START_DATE = END_DATE - pd.DateOffset(years=N_YEARS)

dates = pd.date_range(start=START_DATE, end=END_DATE, freq="D")
n_days = len(dates)
t = np.arange(n_days)

# ---------------------------------------------------------------------------
# STOCKS — Nifty-like broad equity index
# Upward drift + weekly pattern (flat on weekends, since real markets don't
# trade then) + random-walk noise + occasional volatility clusters.
# ---------------------------------------------------------------------------
annual_drift = 0.11  # ~11% average annual growth, roughly matching our
                      # Equity/Stocks asset-class assumption elsewhere in the project
daily_drift = annual_drift / 252  # ~252 trading days/year
daily_vol = 0.011

stock_returns = rng.normal(daily_drift, daily_vol, size=n_days)
# Inject a couple of volatility clusters (realistic market stress periods)
cluster_starts = rng.choice(range(200, n_days - 200), size=3, replace=False)
for cs in cluster_starts:
    window = slice(cs, cs + 20)
    stock_returns[window] += rng.normal(-0.002, 0.02, size=20)

stock_index = 22000 * np.cumprod(1 + stock_returns)
# Flatten weekends (no trading) by holding Friday's close through the weekend
is_weekend = dates.dayofweek >= 5
stock_index_series = pd.Series(stock_index, index=dates)
stock_index_series[is_weekend] = np.nan
stock_index_series = stock_index_series.ffill()

# ---------------------------------------------------------------------------
# GOLD — price per 10g in INR. Smoother upward trend, lower volatility,
# slight negative correlation with stock volatility clusters (flight to
# safety), consistent with the correlation assumptions used in the
# Portfolio Rebalancer.
# ---------------------------------------------------------------------------
gold_annual_drift = 0.09
gold_daily_drift = gold_annual_drift / 365
gold_daily_vol = 0.006

gold_returns = rng.normal(gold_daily_drift, gold_daily_vol, size=n_days)
for cs in cluster_starts:  # gold gets a small BOOST during stock stress
    window = slice(cs, cs + 20)
    gold_returns[window] += rng.normal(0.003, 0.005, size=20)

gold_price = 62000 * np.cumprod(1 + gold_returns)

# ---------------------------------------------------------------------------
# INFLATION — YoY CPI %, mean-reverting around ~5.5% with slow seasonal
# wobble (food/fuel cycles) — generated monthly then interpolated to daily
# for a smooth series, since real CPI prints are monthly, not daily.
# ---------------------------------------------------------------------------
n_months = N_YEARS * 12 + 2  # +2 (not +1) so the last monthly anchor point
                              # extends past END_DATE, giving interpolate()
                              # a right-side bound for the final few days
month_dates = pd.date_range(start=START_DATE, periods=n_months, freq="MS")

inflation_level = 5.5
inflation_values = []
for i in range(n_months):
    seasonal = 0.4 * np.sin(2 * np.pi * i / 12)  # mild annual cycle
    mean_reversion = 0.15 * (5.5 - inflation_level)
    shock = rng.normal(0, 0.25)
    inflation_level = inflation_level + mean_reversion + shock * 0.3
    inflation_values.append(inflation_level + seasonal)

inflation_monthly = pd.Series(inflation_values, index=month_dates)
union_index = dates.union(month_dates)
inflation_full = inflation_monthly.reindex(union_index).interpolate(method="linear")
inflation_daily = inflation_full.reindex(dates)
inflation_daily = inflation_daily.ffill().bfill()

# ---------------------------------------------------------------------------
# ASSEMBLE
# ---------------------------------------------------------------------------
df = pd.DataFrame({
    "date": dates,
    "stocks_index": np.round(stock_index_series.values, 2),
    "gold_price_inr_per_10g": np.round(gold_price, 2),
    "inflation_yoy_pct": np.round(inflation_daily.values, 3),
})

df.to_csv(OUTPUT_FILE, index=False)

print(f"✅ Generated {len(df)} days of market data ({START_DATE.date()} to {END_DATE.date()}) -> '{OUTPUT_FILE}'")
print("\n--- Preview (last 5 rows) ---")
print(df.tail(5).to_string(index=False))
print("\n--- Summary ---")
print(df[["stocks_index", "gold_price_inr_per_10g", "inflation_yoy_pct"]].describe().round(2))