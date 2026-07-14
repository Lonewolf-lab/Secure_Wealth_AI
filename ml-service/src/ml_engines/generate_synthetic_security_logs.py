"""
Secure Wealth Twin — Synthetic API Traffic Dataset Generator
================================================================
Generates request-level traffic features for training an Isolation
Forest that detects anomalous API usage patterns — the "AI-based"
layer of the Vulnerability Scanner, sitting alongside (not replacing)
the signature-based injection detection.

Normal traffic: steady request rate, small payloads, low special-char
density, requests during normal hours, consistent per-client behavior.

Anomalous traffic mimics real attack reconnaissance/exploitation
patterns: scanning behavior (many endpoints hit rapidly), oversized
payloads, high special-character density (injection attempts), and
unusual hour concentration.
"""

import numpy as np
import pandas as pd

N_REQUESTS = 6000
ANOMALY_RATE = 0.03
RANDOM_SEED = 42
OUTPUT_FILE = "api_traffic_logs.csv"

rng = np.random.default_rng(RANDOM_SEED)


def clip(arr, lo, hi):
    return np.clip(arr, lo, hi)


N_ANOMALY = int(N_REQUESTS * ANOMALY_RATE)
N_NORMAL = N_REQUESTS - N_ANOMALY

# ---------------------------------------------------------------------------
# NORMAL TRAFFIC
# ---------------------------------------------------------------------------
normal_payload_size = clip(rng.lognormal(mean=5.0, sigma=0.6, size=N_NORMAL), 50, 5000)
normal_special_char_ratio = clip(rng.beta(2, 30, size=N_NORMAL), 0, 0.15)
normal_requests_per_min = clip(rng.exponential(scale=2.0, size=N_NORMAL), 0.1, 15)
normal_unique_endpoints_last_5min = rng.integers(1, 4, size=N_NORMAL)
normal_hour = rng.integers(6, 23, size=N_NORMAL)
normal_response_time_ms = clip(rng.lognormal(mean=4.5, sigma=0.4, size=N_NORMAL), 20, 2000)
normal_failed_requests_ratio = clip(rng.beta(1, 40, size=N_NORMAL), 0, 0.3)

# ---------------------------------------------------------------------------
# ANOMALOUS TRAFFIC — scanning/exploitation patterns
# ---------------------------------------------------------------------------
anomaly_payload_size = clip(rng.lognormal(mean=7.5, sigma=1.0, size=N_ANOMALY), 500, 50000)
anomaly_special_char_ratio = clip(rng.beta(5, 8, size=N_ANOMALY), 0.15, 0.9)
anomaly_requests_per_min = clip(rng.exponential(scale=25, size=N_ANOMALY), 15, 300)
anomaly_unique_endpoints_last_5min = rng.integers(8, 40, size=N_ANOMALY)
anomaly_hour = rng.integers(0, 24, size=N_ANOMALY)  # attacks don't respect business hours
anomaly_response_time_ms = clip(rng.lognormal(mean=6.0, sigma=1.0, size=N_ANOMALY), 100, 15000)
anomaly_failed_requests_ratio = clip(rng.beta(6, 4, size=N_ANOMALY), 0.3, 1.0)

# ---------------------------------------------------------------------------
# ASSEMBLE
# ---------------------------------------------------------------------------
df_normal = pd.DataFrame({
    "payload_size_bytes": np.round(normal_payload_size, 1),
    "special_char_ratio": np.round(normal_special_char_ratio, 4),
    "requests_per_minute": np.round(normal_requests_per_min, 2),
    "unique_endpoints_last_5min": normal_unique_endpoints_last_5min,
    "hour_of_day": normal_hour,
    "response_time_ms": np.round(normal_response_time_ms, 1),
    "failed_requests_ratio": np.round(normal_failed_requests_ratio, 4),
    "is_anomaly": 0,
})

df_anomaly = pd.DataFrame({
    "payload_size_bytes": np.round(anomaly_payload_size, 1),
    "special_char_ratio": np.round(anomaly_special_char_ratio, 4),
    "requests_per_minute": np.round(anomaly_requests_per_min, 2),
    "unique_endpoints_last_5min": anomaly_unique_endpoints_last_5min,
    "hour_of_day": anomaly_hour,
    "response_time_ms": np.round(anomaly_response_time_ms, 1),
    "failed_requests_ratio": np.round(anomaly_failed_requests_ratio, 4),
    "is_anomaly": 1,
})

df = pd.concat([df_normal, df_anomaly], ignore_index=True)
df = df.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)
df.insert(0, "request_id", [f"REQ-{str(i).zfill(6)}" for i in range(1, len(df) + 1)])

df.to_csv(OUTPUT_FILE, index=False)

print(f"✅ Generated {len(df)} traffic records -> '{OUTPUT_FILE}'")
print(f"   Normal: {(df.is_anomaly==0).sum()} | Anomalous: {(df.is_anomaly==1).sum()} "
      f"({(df.is_anomaly==1).mean()*100:.2f}%)")
print(df.groupby("is_anomaly")[["requests_per_minute", "special_char_ratio", "unique_endpoints_last_5min"]].mean().round(3))