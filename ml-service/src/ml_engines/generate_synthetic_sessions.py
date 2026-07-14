"""
Secure Wealth Twin — Synthetic Session Behavior Dataset Generator
======================================================================
Generates login-session-level behavioral features for training an
Isolation Forest that flags anomalous sessions — the ML layer behind
the Behavioral Biometrics risk scorer, sitting alongside (not
replacing) the per-user baseline z-score comparison in
behavioral_biometrics.py.

This model learns "what does a normal session look like across the
whole user population" (population-level anomaly detection), which is
complementary to the per-user baseline check (which needs an
individual's history to work). New users with no baseline yet still
get SOME protection from this population-level model.
"""

import numpy as np
import pandas as pd

N_SESSIONS = 6000
ANOMALY_RATE = 0.025
RANDOM_SEED = 42
OUTPUT_FILE = "session_behavior_data.csv"

rng = np.random.default_rng(RANDOM_SEED)


def clip(arr, lo, hi):
    return np.clip(arr, lo, hi)


N_ANOMALY = int(N_SESSIONS * ANOMALY_RATE)
N_NORMAL = N_SESSIONS - N_ANOMALY

# ---------------------------------------------------------------------------
# NORMAL SESSIONS
# ---------------------------------------------------------------------------
normal_typing_speed = clip(rng.normal(45, 10, size=N_NORMAL), 15, 90)
normal_keystroke_std_ms = clip(rng.normal(80, 20, size=N_NORMAL), 20, 200)
normal_session_duration_sec = clip(rng.lognormal(mean=5.2, sigma=0.6, size=N_NORMAL), 30, 1800)
normal_login_hour = rng.integers(6, 23, size=N_NORMAL)
normal_geo_distance_km = clip(rng.exponential(scale=5, size=N_NORMAL), 0, 100)
normal_failed_pin_attempts = rng.choice([0, 1], size=N_NORMAL, p=[0.92, 0.08])
normal_device_change = rng.choice([0, 1], size=N_NORMAL, p=[0.95, 0.05])

# ---------------------------------------------------------------------------
# ANOMALOUS SESSIONS — account takeover / bot-like patterns
# ---------------------------------------------------------------------------
anomaly_typing_speed = clip(rng.normal(90, 25, size=N_ANOMALY), 5, 200)  # too fast (bot) or erratic
anomaly_keystroke_std_ms = clip(rng.normal(15, 10, size=N_ANOMALY), 1, 250)  # unnaturally uniform (bot) or wild
anomaly_session_duration_sec = clip(rng.lognormal(mean=3.0, sigma=1.2, size=N_ANOMALY), 2, 3600)
anomaly_login_hour = rng.integers(0, 24, size=N_ANOMALY)
anomaly_geo_distance_km = clip(rng.uniform(200, 4000, size=N_ANOMALY), 200, 5000)
anomaly_failed_pin_attempts = rng.choice([0, 1, 2, 3, 4, 5], size=N_ANOMALY, p=[0.1, 0.1, 0.15, 0.2, 0.2, 0.25])
anomaly_device_change = np.ones(N_ANOMALY, dtype=int)

# ---------------------------------------------------------------------------
# ASSEMBLE
# ---------------------------------------------------------------------------
df_normal = pd.DataFrame({
    "typing_speed_wpm": np.round(normal_typing_speed, 1),
    "keystroke_interval_std_ms": np.round(normal_keystroke_std_ms, 1),
    "session_duration_sec": np.round(normal_session_duration_sec, 1),
    "login_hour": normal_login_hour,
    "geo_distance_from_home_km": np.round(normal_geo_distance_km, 1),
    "failed_pin_attempts": normal_failed_pin_attempts,
    "device_change_flag": normal_device_change,
    "is_anomaly": 0,
})

df_anomaly = pd.DataFrame({
    "typing_speed_wpm": np.round(anomaly_typing_speed, 1),
    "keystroke_interval_std_ms": np.round(anomaly_keystroke_std_ms, 1),
    "session_duration_sec": np.round(anomaly_session_duration_sec, 1),
    "login_hour": anomaly_login_hour,
    "geo_distance_from_home_km": np.round(anomaly_geo_distance_km, 1),
    "failed_pin_attempts": anomaly_failed_pin_attempts,
    "device_change_flag": anomaly_device_change,
    "is_anomaly": 1,
})

df = pd.concat([df_normal, df_anomaly], ignore_index=True)
df = df.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)
df.insert(0, "session_id", [f"SESS-{str(i).zfill(6)}" for i in range(1, len(df) + 1)])

df.to_csv(OUTPUT_FILE, index=False)

print(f"✅ Generated {len(df)} sessions -> '{OUTPUT_FILE}'")
print(f"   Normal: {(df.is_anomaly==0).sum()} | Anomalous: {(df.is_anomaly==1).sum()} "
      f"({(df.is_anomaly==1).mean()*100:.2f}%)")
print(df.groupby("is_anomaly")[["geo_distance_from_home_km", "failed_pin_attempts", "device_change_flag"]].mean().round(2))