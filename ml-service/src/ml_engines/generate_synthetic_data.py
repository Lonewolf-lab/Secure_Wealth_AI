"""
Secure Wealth Twin — Synthetic User Investment Dataset Generator
==================================================================
Generates a realistic, internally-correlated synthetic dataset of Indian
bank users for training the Wealth Manager's tabular ML models:
    - XGBoost Investment/ROI Predictor
    - Portfolio Rebalancing Engine

Design principle: every column is derived from a small set of "latent"
demographic drivers (age, income, risk appetite) using realistic
financial-domain logic, rather than being drawn independently. This is
what makes the dataset look authentic instead of randomly scattered.

Author: Secure Wealth Twin — Data Science Team
"""

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# 0. CONFIG
# ---------------------------------------------------------------------------
N_USERS = 2000
RANDOM_SEED = 42
OUTPUT_FILE = "user_investment_data.csv"

rng = np.random.default_rng(RANDOM_SEED)


def clip(arr, lo, hi):
    return np.clip(arr, lo, hi)


# ---------------------------------------------------------------------------
# 1. AGE — base demographic driver
#    Skewed towards working-age adults (25-55) using a Beta distribution
#    reshaped into the 18-75 range, rather than a flat uniform spread.
# ---------------------------------------------------------------------------
age_raw = rng.beta(a=2.2, b=2.8, size=N_USERS)  # concentrated mid-range
Age = clip(np.round(18 + age_raw * (75 - 18)), 18, 75).astype(int)

# ---------------------------------------------------------------------------
# 2. ANNUAL INCOME (INR) — correlated with Age via a career-earnings curve
#    Income rises through the 20s-40s, plateaus, then softens post-retirement
#    age (55+), with log-normal noise layered on top for realistic spread
#    across income segments (3L - 40L+).
# ---------------------------------------------------------------------------
# Career curve: normalized 0->1->0.6 shape peaking around age 45
career_peak = 45
career_curve = np.exp(-((Age - career_peak) ** 2) / (2 * 18 ** 2))
career_curve = 0.35 + 0.65 * career_curve  # floor so young/old still earn something

base_income = 300_000 + career_curve * 2_600_000  # scales toward ~29L at peak
income_noise = rng.lognormal(mean=0, sigma=0.32, size=N_USERS)
Annual_Income_INR = clip(base_income * income_noise, 300_000, 6_500_000)
Annual_Income_INR = np.round(Annual_Income_INR, -3)  # round to nearest 1,000

# ---------------------------------------------------------------------------
# 3. CURRENT SAVINGS (INR) — correlated with Age (years compounding) AND
#    Income (higher earners save more per year). Modeled as a rough
#    "years-in-workforce x savings-rate x income" accumulation.
# ---------------------------------------------------------------------------
years_working = clip(Age - 22, 0, None)
savings_rate = clip(0.08 + (Annual_Income_INR / 4_200_000) * 0.22, 0.08, 0.35)
savings_noise = rng.lognormal(mean=0, sigma=0.35, size=N_USERS)

Current_Savings_INR = (
    years_working * savings_rate * Annual_Income_INR * 0.6 * savings_noise
)
Current_Savings_INR = clip(Current_Savings_INR, 10_000, 25_000_000)
Current_Savings_INR = np.round(Current_Savings_INR, -3)

# ---------------------------------------------------------------------------
# 4. MONTHLY DISPOSABLE INCOME (INR) — a fraction of monthly income left
#    after estimated living expenses. Higher earners retain a LARGER share
#    (Engel's law: essential-expense proportion shrinks as income grows).
# ---------------------------------------------------------------------------
monthly_income = Annual_Income_INR / 12
expense_ratio = clip(0.75 - (Annual_Income_INR / 4_200_000) * 0.35, 0.35, 0.75)
disposable_noise = rng.normal(1.0, 0.08, size=N_USERS)

Monthly_Disposable_Income_INR = clip(
    monthly_income * (1 - expense_ratio) * disposable_noise, 2_000, None
)
Monthly_Disposable_Income_INR = np.round(Monthly_Disposable_Income_INR, -2)

# ---------------------------------------------------------------------------
# 5. TAX BRACKET — deterministically derived from Annual Income using
#    simplified Indian income-tax slabs (illustrative, new-regime-style).
#    This is NOT random — it must be logically consistent with income.
# ---------------------------------------------------------------------------
def income_to_tax_bracket(income):
    if income <= 700_000:
        return "0%"
    elif income <= 1_200_000:
        return "5%"
    elif income <= 1_500_000:
        return "20%"
    else:
        return "30%"


Tax_Bracket = np.array([income_to_tax_bracket(i) for i in Annual_Income_INR])

# ---------------------------------------------------------------------------
# 6. RISK APPETITE SCORE (1-10) — the second key latent driver.
#    Negatively correlated with Age (older = more conservative),
#    positively correlated with disposable income / savings cushion
#    (financial slack enables risk-taking).
# ---------------------------------------------------------------------------
age_component = (75 - Age) / (75 - 18)  # 1 = young, 0 = old
income_cushion = clip(Monthly_Disposable_Income_INR / 60_000, 0, 1)

risk_base = 1 + 9 * (0.6 * age_component + 0.4 * income_cushion)
risk_noise = rng.normal(0, 1.1, size=N_USERS)
Risk_Appetite_Score = clip(np.round(risk_base + risk_noise), 1, 10).astype(int)

# ---------------------------------------------------------------------------
# 7. INVESTMENT HORIZON (months, 6-120) — younger users and higher risk
#    appetite naturally correlate with LONGER horizons (more runway,
#    more risk tolerance for volatility to smooth out).
# ---------------------------------------------------------------------------
horizon_base = (
    20
    + age_component * 55          # younger -> longer horizon
    + (Risk_Appetite_Score / 10) * 35  # higher risk appetite -> longer horizon
)
horizon_noise = rng.normal(0, 12, size=N_USERS)
Investment_Horizon_Months = clip(
    np.round(horizon_base + horizon_noise), 6, 120
).astype(int)

# ---------------------------------------------------------------------------
# 8. FINANCIAL GOAL — categorical, probabilistically weighted by Age and
#    Horizon rather than uniformly random, so the label distribution
#    tells a coherent life-stage story.
# ---------------------------------------------------------------------------
goals = np.array(["Tax Saving", "Wealth Creation", "Retirement", "Short-term Gain"])
Financial_Goal = np.empty(N_USERS, dtype=object)

for i in range(N_USERS):
    a = Age[i]
    h = Investment_Horizon_Months[i]
    tb = Tax_Bracket[i]

    if a >= 50 or h >= 84:
        # Near/at retirement age, or very long horizon -> Retirement dominant
        p = [0.15, 0.15, 0.60, 0.10]
    elif tb in ("20%", "30%") and a < 50:
        # High tax bracket, still working -> Tax Saving becomes attractive
        p = [0.45, 0.30, 0.10, 0.15]
    elif h <= 18:
        # Short horizon -> Short-term Gain dominant
        p = [0.10, 0.20, 0.05, 0.65]
    else:
        # Default mid-career mix -> Wealth Creation dominant
        p = [0.15, 0.55, 0.15, 0.15]

    Financial_Goal[i] = rng.choice(goals, p=p)

# ---------------------------------------------------------------------------
# 9. RECOMMENDED ASSET CLASS (Target Label) — derived from a WEIGHTED
#    SCORE combining Risk Appetite, Age, and Horizon, mirroring how a
#    real advisory rules-engine would map profile -> asset class.
#    A controlled amount of noise is injected so the label isn't a
#    perfectly deterministic function (keeps it learnable, not trivial).
# ---------------------------------------------------------------------------
# Normalize drivers to 0-1
risk_norm = Risk_Appetite_Score / 10
horizon_norm = Investment_Horizon_Months / 120
age_conservatism = Age / 75  # higher = more conservative pull

# Composite "aggressiveness score": higher -> Equity, lower -> Bonds/Gold
aggressiveness = (
    0.55 * risk_norm
    + 0.30 * horizon_norm
    - 0.15 * age_conservatism
)
aggressiveness = clip(aggressiveness + rng.normal(0, 0.07, N_USERS), 0, 1)

Recommended_Asset_Class = np.empty(N_USERS, dtype=object)
for i in range(N_USERS):
    score = aggressiveness[i]
    goal = Financial_Goal[i]

    if goal == "Tax Saving":
        # Tax-saving goal steers heavily toward Mutual Funds (ELSS) / Bonds
        Recommended_Asset_Class[i] = "Mutual Funds" if score > 0.35 else "Bonds"
    elif score >= 0.68:
        Recommended_Asset_Class[i] = "Equity/Stocks"
    elif score >= 0.45:
        Recommended_Asset_Class[i] = "Mutual Funds"
    elif score >= 0.25:
        Recommended_Asset_Class[i] = "Gold"
    else:
        Recommended_Asset_Class[i] = "Bonds"

# ---------------------------------------------------------------------------
# 10. HISTORICAL PORTFOLIO ROI (%) — correlated with the asset class just
#     assigned (each asset class has a realistic historical return band
#     in the Indian market context) plus individual variance from the
#     user's own risk score (higher risk = higher variance in outcomes).
# ---------------------------------------------------------------------------
roi_bands = {
    "Bonds": (5.5, 1.2),
    "Gold": (8.0, 3.0),
    "Mutual Funds": (11.5, 4.5),
    "Equity/Stocks": (14.5, 8.5),
}

Historical_Portfolio_ROI = np.empty(N_USERS)
for i in range(N_USERS):
    mean_roi, base_std = roi_bands[Recommended_Asset_Class[i]]
    # Higher risk-appetite individuals see wider swings even within the
    # same asset class (more volatile fund/stock picks within the class)
    personal_std = base_std * (0.6 + 0.08 * Risk_Appetite_Score[i])
    Historical_Portfolio_ROI[i] = rng.normal(mean_roi, personal_std)

Historical_Portfolio_ROI = np.round(clip(Historical_Portfolio_ROI, -15, 45), 2)

# ---------------------------------------------------------------------------
# 11. USER ID
# ---------------------------------------------------------------------------
User_ID = [f"SWT-{str(i).zfill(5)}" for i in range(1, N_USERS + 1)]

# ---------------------------------------------------------------------------
# ASSEMBLE FINAL DATAFRAME
# ---------------------------------------------------------------------------
df = pd.DataFrame(
    {
        "User_ID": User_ID,
        "Age": Age,
        "Annual_Income_INR": Annual_Income_INR,
        "Current_Savings_INR": Current_Savings_INR,
        "Monthly_Disposable_Income_INR": Monthly_Disposable_Income_INR,
        "Tax_Bracket": Tax_Bracket,
        "Financial_Goal": Financial_Goal,
        "Risk_Appetite_Score": Risk_Appetite_Score,
        "Investment_Horizon_Months": Investment_Horizon_Months,
        "Recommended_Asset_Class": Recommended_Asset_Class,
        "Historical_Portfolio_ROI": Historical_Portfolio_ROI,
    }
)

# ---------------------------------------------------------------------------
# SAVE
# ---------------------------------------------------------------------------
df.to_csv(OUTPUT_FILE, index=False)

print(f"✅ Generated {len(df)} synthetic user records -> '{OUTPUT_FILE}'")
print("\n--- Preview ---")
print(df.head(8).to_string(index=False))

print("\n--- Sanity Checks (correlation validation) ---")
print("Age vs Risk_Appetite_Score corr:      ",
      round(np.corrcoef(df.Age, df.Risk_Appetite_Score)[0, 1], 3), "(expect negative)")
print("Income vs Current_Savings corr:       ",
      round(np.corrcoef(df.Annual_Income_INR, df.Current_Savings_INR)[0, 1], 3), "(expect positive)")
print("Age vs Investment_Horizon_Months corr:",
      round(np.corrcoef(df.Age, df.Investment_Horizon_Months)[0, 1], 3), "(expect negative)")
print("\nRecommended_Asset_Class distribution:")
print(df.Recommended_Asset_Class.value_counts())
print("\nAvg ROI by Asset Class:")
print(df.groupby("Recommended_Asset_Class")["Historical_Portfolio_ROI"].mean().round(2))
