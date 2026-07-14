# Secure Wealth Twin — ML Microservice (Python/FastAPI)

This is the Python ML backend for Secure Wealth Twin. It runs as a **separate
service** from the Java/Spring backend and the React frontend — the frontend
(or the Java backend, acting as a proxy) calls these endpoints over HTTP.

---

## Setup

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

### Train the models (required — nothing is pre-trained)

Run these **once**, from inside `src/ml_engines/`, in this exact order:

```bash
cd src/ml_engines

python generate_synthetic_data.py
python train_wealth_model.py

python generate_synthetic_transactions.py
python train_fraud_detector.py

python generate_synthetic_market_data.py
python train_market_forecaster.py          # requires: pip install prophet

python generate_synthetic_security_logs.py
python train_vulnerability_model.py

python generate_synthetic_sessions.py
python train_behavioral_model.py
```

This produces every file in `models/`. Training does **not** happen at
request time — the server only loads these saved files at startup.

### Run the server

```bash
cd ../..                        # back to project root
uvicorn src.main:app --reload
```

Server runs at `http://127.0.0.1:8000`. Interactive docs (test every endpoint
directly in the browser) at **`http://127.0.0.1:8000/docs`**.

---

## Response contract (applies to every endpoint below)

**Every successful response** is JSON with `"success": true` plus the
endpoint-specific fields documented below.

**Every error response** returns a non-200 HTTP status code with this shape:
```json
{ "detail": "human-readable error message" }
```
| Status | Meaning |
|---|---|
| `422` | Request body failed validation (wrong type, missing field, invalid enum value) — check field names/types below exactly |
| `400` | Valid request shape, but processing failed (e.g. bad `regime` value) |
| `503` | A model isn't loaded on the server (rare — means training wasn't run) |

CORS is currently **open to all origins (`*`)** for development. This will
be locked down to the specific frontend URL before production — if that
happens, the frontend's exact origin needs to be added to `main.py`.

---

## Endpoints

### `POST /api/predict` — Investment/Asset-Class Recommendation

**Request body:**
```json
{
  "Age": 29,
  "Annual_Income_INR": 1800000,
  "Current_Savings_INR": 900000,
  "Monthly_Disposable_Income_INR": 65000,
  "Tax_Bracket": "20%",
  "Financial_Goal": "Wealth Creation",
  "Risk_Appetite_Score": 8,
  "Investment_Horizon_Months": 96
}
```
- `Tax_Bracket` must be exactly one of: `"0%"`, `"5%"`, `"20%"`, `"30%"`
- `Financial_Goal` must be exactly one of: `"Tax Saving"`, `"Wealth Creation"`, `"Retirement"`, `"Short-term Gain"`
- `Risk_Appetite_Score`: integer 1-10
- `Investment_Horizon_Months`: integer 6-120

**Response:**
```json
{
  "success": true,
  "recommended_asset_class": "Mutual Funds",
  "source": "ml_model",
  "reason": null,
  "class_probabilities": { "Bonds": 0.02, "Equity/Stocks": 0.15, "Gold": 0.05, "Mutual Funds": 0.78 }
}
```
`source` will be `"ml_model"`, `"guardrail_fallback"`, or `"confidence_abstention"` — if not `"ml_model"`, `reason` explains why the safe default was used instead.

---

### `POST /api/tax-saving?regime=new` — Tax Analysis (deterministic, not ML)

Same request body as `/api/predict` (only `Age` and `Annual_Income_INR` are actually used). Query param `regime` = `"old"` or `"new"` (default `"new"`).

**Response (abbreviated):**
```json
{
  "success": true,
  "total_tax_payable_inr": 145600.0,
  "recommended_regime": "new",
  "comparison": { "new_regime_tax_inr": 0.0, "old_regime_tax_inr_no_deductions": 145600.0, "old_regime_tax_inr_fully_maxed": 78000.0 },
  "recommended_instruments": []
}
```

---

### `POST /api/rebalance-portfolio` — Portfolio Rebalancing (MPT, not ML)

**Request body:**
```json
{
  "Risk_Appetite_Score": 7,
  "current_allocation": { "Bonds": 0.5, "Equity/Stocks": 0.5, "Gold": 0.0, "Mutual Funds": 0.0 }
}
```
`current_allocation` is **optional** — omit it to just get the optimal allocation without rebalancing deltas.

**Response (abbreviated):**
```json
{
  "success": true,
  "recommended_weights": { "Bonds": 20.0, "Equity/Stocks": 45.0, "Gold": 15.0, "Mutual Funds": 20.0 },
  "expected_return_pct": 10.8,
  "expected_volatility_pct": 4.2,
  "efficient_frontier": [ { "expected_return_pct": 6.19, "volatility_pct": 1.1 }, "... more points, chart-ready" ],
  "rebalancing_actions": [ { "asset_class": "Bonds", "current_weight_pct": 50.0, "recommended_weight_pct": 20.0, "action": "decrease" } ]
}
```

---

### `POST /api/detect-fraud` — Fraud/Anomaly Detection

**Request body:**
```json
{
  "Transaction_Amount_INR": 1200,
  "Transaction_Type": "UPI",
  "Merchant_Category": "Grocery",
  "Hour_of_Day": 14,
  "Day_of_Week": 2,
  "Is_New_Device": 0,
  "Is_New_Location": 0,
  "Distance_From_Home_KM": 3.5,
  "Account_Age_Days": 900,
  "Time_Since_Last_Transaction_Minutes": 120
}
```
- `Transaction_Type`: one of `"UPI"`, `"NEFT"`, `"Card Payment"`, `"ATM Withdrawal"`, `"Wire Transfer"`
- `Merchant_Category`: one of `"Grocery"`, `"Electronics"`, `"Travel"`, `"Utility Bills"`, `"Entertainment"`, `"Jewelry"`, `"Cash Withdrawal"`, `"Others"`
- `Day_of_Week`: 0=Monday ... 6=Sunday

**Response:**
```json
{ "success": true, "is_anomaly": false, "risk_score": 2.1, "risk_level": "Low", "raw_anomaly_score": 0.093 }
```

---

### `GET /api/market-forecast/{series}?days=30` — Market Trend Forecast

`series` path param: `stocks`, `gold`, or `inflation`. `days` query param: 1-365.

**Response (abbreviated):**
```json
{
  "success": true, "series": "gold", "forecast_horizon_days": 5,
  "forecast": [ { "date": "2026-07-15", "predicted_value": 56775.33, "lower_bound": 55701.96, "upper_bound": 57774.56 } ]
}
```

---

### `POST /api/narrate` — Plain-Language Explanation

Accepts **the raw JSON response from any other endpoint above** and returns a human-readable summary. Useful for showing a "why" explanation in the UI.

**Request body:** any of the response JSONs shown above (just forward what another endpoint returned).

**Response:**
```json
{ "success": true, "narrative": "Based on ml model, we recommend Mutual Funds as your primary asset class.", "source": "template_fallback" }
```
`source` is `"llm"` if a local Ollama model answered, or `"template_fallback"` if not (still accurate either way — see code comments in `llm_narrator.py`).

---

### `POST /api/scan-vulnerability?client_id=...&endpoint=...` — Security Scan

**Request body:** any JSON dict (typically the SAME payload being sent to another endpoint, scanned before/alongside it).

**Response:**
```json
{
  "success": true, "is_vulnerable": false, "risk_level": "Low",
  "injection_findings": [], "rate_analysis": { "is_rate_anomaly": false }, "ml_analysis": { "ml_available": true, "ml_is_anomaly": false, "ml_risk_score": 12.4 }
}
```

---

### `POST /api/session-risk` — Behavioral Biometrics / Login Risk

**Request body:**
```json
{
  "current_session": { "device_fingerprint": "dev1", "city": "Mumbai", "login_hour": 9, "typing_speed_wpm": 44, "geo_distance_from_home_km": 3, "failed_pin_attempts": 0, "device_change_flag": 0 },
  "baseline": { "known_device_fingerprints": ["dev1"], "known_cities": ["Mumbai"], "typical_login_hours": [9], "avg_typing_speed_wpm": 45.0, "typing_speed_std_wpm": 8.0 }
}
```
`baseline` is **optional** — omit for a first-time session (falls back to population-level ML scoring only).

**Response:**
```json
{ "success": true, "risk_score": 0.0, "risk_level": "Low", "flagged_factors": ["Session matches established behavioral baseline."], "requires_step_up_auth": false }
```

---

### `GET /health`

```json
{ "status": "healthy", "model_loaded": true, "preprocessor_loaded": true, "label_encoder_loaded": true }
```
Useful for the frontend (or a monitoring tool) to check the backend is actually ready before sending real requests.

---

## Project structure

```
.
├── requirements.txt
├── .gitignore
├── src/
│   ├── main.py                    ← all API routes
│   ├── api/schemas.py               ← request/response validation
│   ├── guardrails/compliance.py      ← deterministic safety rules + confidence abstention
│   └── ml_engines/                    ← every model + training script
├── data/                            ← synthetic datasets (generated)
├── models/                          ← trained artifacts (generated, gitignored)
└── logs/                            ← guardrail audit trail (generated, gitignored)
```

## Known limitations (be upfront about these if asked)

- All models trained on **synthetic data** — realistic correlations, not real historical data. Swappable without code changes once real data exists.
- No authentication yet — CORS is open (`*`). Planned but deferred pending frontend coordination.
- `models/` and `logs/` are gitignored — clone this repo, then run the training commands above before starting the server, or `models/` will be empty and the server will start with warnings (it degrades gracefully, but predictions won't work until trained).