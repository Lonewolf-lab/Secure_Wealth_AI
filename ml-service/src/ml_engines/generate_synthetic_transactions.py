"""
Secure Wealth Twin — Synthetic Transaction Dataset Generator
================================================================
Generates a realistic banking transaction dataset for training the
Fraud/Anomaly Detector (Security Twin pillar). Unlike the user-profile
dataset, this is transaction-level: thousands of individual transactions,
the overwhelming majority legitimate, with a small injected minority of
fraudulent patterns.

Design principle: fraudulent transactions are NOT randomly labeled —
they're generated with DISTINCT underlying patterns (odd hours, new
device + new location combined, high velocity, unusual distance from
home) that mirror how real fraud actually looks. This is what makes an
Isolation Forest trained on this data behave sensibly rather than
learning noise.

Is_Fraud is included ONLY for evaluation purposes — Isolation Forest is
UNSUPERVISED and never sees this column during training. It exists so
we can measure precision/recall after the fact, which we couldn't do at
all with a purely unlabeled real-world dataset.
"""

import numpy as np
import pandas as pd

N_TRANSACTIONS = 8000
FRAUD_RATE = 0.02  # ~2% of transactions are fraudulent — realistic rare-event rate
RANDOM_SEED = 42
OUTPUT_FILE = "transactions_data.csv"

rng = np.random.default_rng(RANDOM_SEED)


def clip(arr, lo, hi):
    return np.clip(arr, lo, hi)


N_FRAUD = int(N_TRANSACTIONS * FRAUD_RATE)
N_LEGIT = N_TRANSACTIONS - N_FRAUD

TRANSACTION_TYPES = ["UPI", "NEFT", "Card Payment", "ATM Withdrawal", "Wire Transfer"]
MERCHANT_CATEGORIES = [
    "Grocery", "Electronics", "Travel", "Utility Bills",
    "Entertainment", "Jewelry", "Cash Withdrawal", "Others",
]

# ---------------------------------------------------------------------------
# LEGITIMATE TRANSACTIONS — everyday, familiar patterns
# ---------------------------------------------------------------------------
legit_amount = rng.lognormal(mean=7.5, sigma=1.1, size=N_LEGIT)  # centered ~₹1,800
legit_amount = clip(legit_amount, 50, 150_000)

legit_type = rng.choice(
    TRANSACTION_TYPES, size=N_LEGIT, p=[0.45, 0.15, 0.30, 0.08, 0.02]
)
legit_merchant = rng.choice(
    MERCHANT_CATEGORIES, size=N_LEGIT,
    p=[0.28, 0.12, 0.08, 0.20, 0.15, 0.02, 0.10, 0.05],
)

# Normal transactions cluster around waking hours (8am-11pm), rarely 12am-5am
_legit_hour_probs = np.array([
    0.003, 0.002, 0.002, 0.002, 0.003, 0.01,   # 0-5am: very rare
    0.03, 0.05, 0.07, 0.06, 0.055, 0.06,        # 6-11am
    0.07, 0.065, 0.055, 0.05, 0.055, 0.06,      # 12-5pm
    0.065, 0.06, 0.05, 0.035, 0.02, 0.01,       # 6-11pm
])
_legit_hour_probs = _legit_hour_probs / _legit_hour_probs.sum()
legit_hour = rng.choice(range(24), size=N_LEGIT, p=_legit_hour_probs)

legit_day = rng.integers(0, 7, size=N_LEGIT)
legit_new_device = rng.choice([0, 1], size=N_LEGIT, p=[0.95, 0.05])
legit_new_location = rng.choice([0, 1], size=N_LEGIT, p=[0.92, 0.08])
legit_distance = rng.exponential(scale=8, size=N_LEGIT)  # mostly near home
legit_distance = clip(legit_distance, 0, 80)
legit_account_age = rng.integers(30, 3650, size=N_LEGIT)
legit_time_since_last = rng.exponential(scale=180, size=N_LEGIT)  # minutes; mostly spaced out
legit_time_since_last = clip(legit_time_since_last, 1, 10_000)

# ---------------------------------------------------------------------------
# FRAUDULENT TRANSACTIONS — distinct, realistic anomaly patterns
# ---------------------------------------------------------------------------
# Pattern mix: half are "account takeover" style (new device + new location +
# odd hour + high amount), half are "card testing / velocity attack" style
# (small-to-medium amounts, very high frequency, short time gaps).
n_takeover = N_FRAUD // 2
n_velocity = N_FRAUD - n_takeover

# --- Account takeover pattern ---
takeover_amount = rng.lognormal(mean=9.5, sigma=0.8, size=n_takeover)  # much larger
takeover_amount = clip(takeover_amount, 5_000, 500_000)
takeover_type = rng.choice(TRANSACTION_TYPES, size=n_takeover, p=[0.10, 0.15, 0.15, 0.10, 0.50])
takeover_merchant = rng.choice(MERCHANT_CATEGORIES, size=n_takeover, p=[0.05, 0.15, 0.05, 0.02, 0.05, 0.35, 0.28, 0.05])
takeover_hour = rng.choice(range(24), size=n_takeover, p=np.array(
    [0.10]*6 + [0.02]*12 + [0.10]*6  # weighted toward 0-5am and 6-11pm (odd hours)
) / np.sum([0.10]*6 + [0.02]*12 + [0.10]*6))
takeover_day = rng.integers(0, 7, size=n_takeover)
takeover_new_device = np.ones(n_takeover, dtype=int)   # always new device
takeover_new_location = np.ones(n_takeover, dtype=int)  # always new location
takeover_distance = rng.uniform(200, 3000, size=n_takeover)  # far from home
takeover_account_age = rng.integers(30, 3650, size=n_takeover)
takeover_time_since_last = rng.exponential(scale=300, size=n_takeover)
takeover_time_since_last = clip(takeover_time_since_last, 1, 10_000)

# --- Velocity attack pattern ---
velocity_amount = rng.lognormal(mean=6.5, sigma=0.9, size=n_velocity)  # small-medium
velocity_amount = clip(velocity_amount, 100, 20_000)
velocity_type = rng.choice(TRANSACTION_TYPES, size=n_velocity, p=[0.55, 0.05, 0.30, 0.05, 0.05])
velocity_merchant = rng.choice(MERCHANT_CATEGORIES, size=n_velocity, p=[0.15, 0.20, 0.05, 0.05, 0.15, 0.10, 0.05, 0.25])
velocity_hour = rng.integers(0, 24, size=n_velocity)  # any hour, not the signal here
velocity_day = rng.integers(0, 7, size=n_velocity)
velocity_new_device = rng.choice([0, 1], size=n_velocity, p=[0.4, 0.6])
velocity_new_location = rng.choice([0, 1], size=n_velocity, p=[0.5, 0.5])
velocity_distance = rng.exponential(scale=20, size=n_velocity)
velocity_distance = clip(velocity_distance, 0, 200)
velocity_account_age = rng.integers(30, 3650, size=n_velocity)
# THE signal for velocity attacks: extremely short gaps between transactions
velocity_time_since_last = rng.exponential(scale=2, size=n_velocity)
velocity_time_since_last = clip(velocity_time_since_last, 0.1, 30)

# ---------------------------------------------------------------------------
# ASSEMBLE
# ---------------------------------------------------------------------------
df_legit = pd.DataFrame({
    "Transaction_Amount_INR": np.round(legit_amount, 2),
    "Transaction_Type": legit_type,
    "Merchant_Category": legit_merchant,
    "Hour_of_Day": legit_hour,
    "Day_of_Week": legit_day,
    "Is_New_Device": legit_new_device,
    "Is_New_Location": legit_new_location,
    "Distance_From_Home_KM": np.round(legit_distance, 2),
    "Account_Age_Days": legit_account_age,
    "Time_Since_Last_Transaction_Minutes": np.round(legit_time_since_last, 2),
    "Is_Fraud": 0,
})

df_takeover = pd.DataFrame({
    "Transaction_Amount_INR": np.round(takeover_amount, 2),
    "Transaction_Type": takeover_type,
    "Merchant_Category": takeover_merchant,
    "Hour_of_Day": takeover_hour,
    "Day_of_Week": takeover_day,
    "Is_New_Device": takeover_new_device,
    "Is_New_Location": takeover_new_location,
    "Distance_From_Home_KM": np.round(takeover_distance, 2),
    "Account_Age_Days": takeover_account_age,
    "Time_Since_Last_Transaction_Minutes": np.round(takeover_time_since_last, 2),
    "Is_Fraud": 1,
})

df_velocity = pd.DataFrame({
    "Transaction_Amount_INR": np.round(velocity_amount, 2),
    "Transaction_Type": velocity_type,
    "Merchant_Category": velocity_merchant,
    "Hour_of_Day": velocity_hour,
    "Day_of_Week": velocity_day,
    "Is_New_Device": velocity_new_device,
    "Is_New_Location": velocity_new_location,
    "Distance_From_Home_KM": np.round(velocity_distance, 2),
    "Account_Age_Days": velocity_account_age,
    "Time_Since_Last_Transaction_Minutes": np.round(velocity_time_since_last, 2),
    "Is_Fraud": 1,
})

df = pd.concat([df_legit, df_takeover, df_velocity], ignore_index=True)
df = df.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)  # shuffle

df.insert(0, "Transaction_ID", [f"TXN-{str(i).zfill(6)}" for i in range(1, len(df) + 1)])

df.to_csv(OUTPUT_FILE, index=False)

print(f"✅ Generated {len(df)} transactions -> '{OUTPUT_FILE}'")
print(f"   Legitimate: {(df.Is_Fraud == 0).sum()} | Fraudulent: {(df.Is_Fraud == 1).sum()} "
      f"({(df.Is_Fraud == 1).mean() * 100:.2f}%)")
print("\n--- Preview ---")
print(df.head(5).to_string(index=False))
print("\n--- Sanity check: fraud vs legit distance from home ---")
print(df.groupby("Is_Fraud")["Distance_From_Home_KM"].mean().round(2))
print("\n--- Sanity check: fraud vs legit time since last transaction ---")
print(df.groupby("Is_Fraud")["Time_Since_Last_Transaction_Minutes"].median().round(2))