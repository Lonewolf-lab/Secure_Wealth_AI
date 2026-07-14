import sys
from pathlib import Path
from typing import Any, Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Dynamic pathing: resolved relative to THIS FILE's location on disk, so
# imports and model loading work correctly no matter which directory the
# terminal is in when uvicorn is launched.
#   This file lives at:  <project_root>/src/main.py
#   Models live at:      <project_root>/models/
#   Guardrails live at:  <project_root>/src/guardrails/compliance.py
# ---------------------------------------------------------------------------
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent   # SecureWealthTwin/
src_path = current_file.parent              # SecureWealthTwin/src/

if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from api.schemas import InvestmentRequest, PortfolioRebalanceRequest, TransactionRequest, ChatRequest, ChatResponse
from guardrails.compliance import validate_financial_guardrails, validate_prediction_confidence
from ml_engines.tax_saving_engine import analyze_tax_situation
from ml_engines.portfolio_rebalancer import recommend_portfolio_allocation
from ml_engines.llm_narrator import generate_narrative
from ml_engines.vulnerability_scanner import run_vulnerability_scan
from ml_engines.behavioral_biometrics import compute_session_risk_score

app = FastAPI(title="Secure Wealth Twin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = project_root / "models" / "investment_model.pkl"
PREPROCESSOR_PATH = project_root / "models" / "preprocessors.joblib"
FRAUD_MODEL_PATH = project_root / "models" / "fraud_model.pkl"
FRAUD_PREPROCESSOR_PATH = project_root / "models" / "fraud_preprocessor.joblib"

# Populated on startup. Kept as separate globals (rather than one bundle
# object) since that's what the rest of the endpoint code reads from directly.
model = None
feature_preprocessor = None
label_encoder = None
fraud_model = None
fraud_preprocessor = None
market_models = None
vulnerability_model = None
vulnerability_scaler = None
vulnerability_feature_columns = None
behavioral_model = None
behavioral_scaler = None
behavioral_feature_columns = None


@app.on_event("startup")
def load_models():
    global model, feature_preprocessor, label_encoder, fraud_model, fraud_preprocessor
    try:
        if not MODEL_PATH.exists() or not PREPROCESSOR_PATH.exists():
            raise FileNotFoundError(
                "Saved ML model binary files were not found in the models/ folder. "
                f"Expected: {MODEL_PATH} and {PREPROCESSOR_PATH}"
            )

        model = joblib.load(MODEL_PATH)

        bundle = joblib.load(PREPROCESSOR_PATH)
        if not isinstance(bundle, dict) or "feature_preprocessor" not in bundle or "label_encoder" not in bundle:
            raise ValueError(
                "preprocessors.joblib is not in the expected bundle format. "
                "Expected a dict with keys 'feature_preprocessor' and 'label_encoder'. "
                "Re-run train_wealth_model.py to regenerate it in the correct format."
            )

        feature_preprocessor = bundle["feature_preprocessor"]
        label_encoder = bundle["label_encoder"]

        print(
            "🚀 Success: Model + feature_preprocessor + label_encoder loaded. "
            f"Known classes: {list(label_encoder.classes_)}"
        )

    except Exception as e:
        print(f"❌ Critical Error loading models: {str(e)}")

    # Fraud model loaded separately and fail-soft: if it's missing, the
    # rest of the app (predict/tax-saving/rebalance) should still work.
    try:
        if not FRAUD_MODEL_PATH.exists() or not FRAUD_PREPROCESSOR_PATH.exists():
            raise FileNotFoundError(
                f"Fraud model files not found. Expected: {FRAUD_MODEL_PATH} and {FRAUD_PREPROCESSOR_PATH}. "
                "Run train_fraud_detector.py first."
            )
        fraud_model = joblib.load(FRAUD_MODEL_PATH)
        fraud_bundle = joblib.load(FRAUD_PREPROCESSOR_PATH)
        fraud_preprocessor = fraud_bundle["feature_preprocessor"]
        print("🚀 Success: Fraud detection model + preprocessor loaded.")
    except Exception as e:
        print(f"⚠️  Fraud model not loaded (fraud detection endpoint will be unavailable): {str(e)}")

    global market_models
    try:
        market_path = project_root / "models" / "market_forecast_models.joblib"
        if not market_path.exists():
            raise FileNotFoundError(f"Market forecast models not found at {market_path}. Run train_market_forecaster.py first.")
        market_bundle = joblib.load(market_path)
        market_models = market_bundle["models"]
        print(f"🚀 Success: Market forecast models loaded ({list(market_models.keys())}).")
    except Exception as e:
        print(f"⚠️  Market forecast models not loaded: {str(e)}")

    global vulnerability_model, vulnerability_scaler, vulnerability_feature_columns
    try:
        v_model_path = project_root / "models" / "vulnerability_model.pkl"
        v_prep_path = project_root / "models" / "vulnerability_preprocessor.joblib"
        vulnerability_model = joblib.load(v_model_path)
        v_bundle = joblib.load(v_prep_path)
        vulnerability_scaler = v_bundle["scaler"]
        vulnerability_feature_columns = v_bundle["feature_columns"]
        print("🚀 Success: Vulnerability ML model loaded.")
    except Exception as e:
        print(f"⚠️  Vulnerability ML model not loaded (signature-based scanning still works): {str(e)}")

    global behavioral_model, behavioral_scaler, behavioral_feature_columns
    try:
        b_model_path = project_root / "models" / "behavioral_model.pkl"
        b_prep_path = project_root / "models" / "behavioral_preprocessor.joblib"
        behavioral_model = joblib.load(b_model_path)
        b_bundle = joblib.load(b_prep_path)
        behavioral_scaler = b_bundle["scaler"]
        behavioral_feature_columns = b_bundle["feature_columns"]
        print("🚀 Success: Behavioral biometrics ML model loaded.")
    except Exception as e:
        print(f"⚠️  Behavioral ML model not loaded (rule-based baseline check still works): {str(e)}")


@app.get("/")
def read_root():
    return {"status": "healthy", "service": "Secure Wealth Twin ML Engine"}


@app.get("/health")
def health():
    return {
        "status": "healthy" if model is not None else "not_ready",
        "model_loaded": model is not None,
        "preprocessor_loaded": feature_preprocessor is not None,
        "label_encoder_loaded": label_encoder is not None,
    }


@app.post("/api/predict")
def predict_investment(payload: InvestmentRequest):
    if model is None or feature_preprocessor is None or label_encoder is None:
        raise HTTPException(status_code=500, detail="Machine Learning models are not loaded on the server.")

    input_data: dict[str, Any] = payload.dict()

    # -----------------------------------------------------------------
    # GUARDRAIL CHECK — runs BEFORE the ML model ever sees the request.
    # If a deterministic safety rule fires, we return the safe fallback
    # immediately and never touch the model for this request. This is
    # the core of the "99.99% safe" architectural story: the model is
    # never the last word, the compliance layer is.
    # -----------------------------------------------------------------
    try:
        guardrail_result = validate_financial_guardrails(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Guardrail check failed: {str(e)}")

    if not guardrail_result["is_compliant"]:
        return {
            "success": True,
            "recommended_asset_class": guardrail_result["fallback_asset_class"],
            "source": "guardrail_fallback",
            "reason": guardrail_result["reason"],
        }

    # -----------------------------------------------------------------
    # ML INFERENCE — only reached if the guardrail layer cleared the request.
    # -----------------------------------------------------------------
    try:
        df = pd.DataFrame([input_data])

        X_processed = feature_preprocessor.transform(df)
        numeric_prediction = model.predict(X_processed)[0]
        prediction_probabilities = model.predict_proba(X_processed)[0]

        # THE LABEL FIX: always resolve via the fitted LabelEncoder, never
        # a hardcoded dict. LabelEncoder assigns codes alphabetically, so
        # a manually typed {0: "Bonds", 1: ...} mapping can silently drift
        # out of sync with the model's actual training order.
        recommended_asset = label_encoder.inverse_transform([int(numeric_prediction)])[0]

        class_probabilities = {
            label: float(prob)
            for label, prob in zip(label_encoder.classes_, prediction_probabilities)
        }

        # -------------------------------------------------------------
        # STAGE 2 GUARDRAIL — confidence-based abstention. Even though
        # the request passed all pre-inference rules, the model's OWN
        # prediction still isn't trusted blindly: if its top-class
        # confidence is too low, we discard the guess and fall back to
        # the safe default rather than show an uncertain answer.
        # -------------------------------------------------------------
        confidence_check = validate_prediction_confidence(input_data, class_probabilities)

        if not confidence_check["is_compliant"]:
            return {
                "success": True,
                "recommended_asset_class": confidence_check["fallback_asset_class"],
                "source": "confidence_abstention",
                "reason": confidence_check["reason"],
                "model_top_choice": recommended_asset,
                "class_probabilities": class_probabilities,
            }

        return {
            "success": True,
            "recommended_asset_class": recommended_asset,
            "source": "ml_model",
            "reason": None,
            "class_probabilities": class_probabilities,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference Engine failed: {str(e)}")


@app.post("/api/tax-saving")
def get_tax_saving_recommendations(payload: InvestmentRequest, regime: str = "new"):
    """
    Deterministic Tax Saving Rules Engine — NOT an ML model. Given the
    same input, this always returns the exact same output, which is the
    intentional design choice for tax-related recommendations (Section B
    of the architecture blueprint: tax law is not probabilistic).

    Query param 'regime' accepts "old" or "new" (defaults to "new").
    The response also includes a side-by-side comparison of both regimes
    and a recommended regime, regardless of which one was requested.
    """
    if regime not in ("old", "new"):
        raise HTTPException(status_code=422, detail="regime must be 'old' or 'new'.")

    try:
        input_data = payload.dict()
        result = analyze_tax_situation(input_data, regime=regime)
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Tax saving calculation failed: {str(e)}")


@app.post("/api/rebalance-portfolio")
def rebalance_portfolio(payload: PortfolioRebalanceRequest):
    """
    Portfolio Rebalancing Engine — Mean-Variance Optimization (MPT), NOT
    an ML classifier. Given a risk appetite score, returns the
    mathematically optimal asset allocation on the efficient frontier.
    If current_allocation is provided, also returns concrete rebalancing
    actions (buy/sell deltas per asset class).
    """
    try:
        result = recommend_portfolio_allocation(
            risk_appetite_score=payload.Risk_Appetite_Score,
            current_allocation=payload.current_allocation,
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Portfolio rebalancing failed: {str(e)}")


# Calibration bounds for converting Isolation Forest's raw decision_function
# output into a 0-100 risk score. Derived from the training data's actual
# score distribution (see train_fraud_detector.py evaluation output) —
# roughly -0.15 (highly anomalous) to +0.15 (very normal).
_FRAUD_SCORE_LOW = -0.15
_FRAUD_SCORE_HIGH = 0.15


@app.post("/api/detect-fraud")
def detect_fraud(payload: TransactionRequest):
    """
    Fraud/Anomaly Detector — Isolation Forest, UNSUPERVISED. Flags a
    single transaction as anomalous or not, with a 0-100 risk score.
    This is the real-time alert mechanism from the Security Twin pillar
    (Section A of the architecture blueprint).
    """
    if fraud_model is None or fraud_preprocessor is None:
        raise HTTPException(status_code=503, detail="Fraud detection model is not loaded on the server.")

    try:
        input_data = payload.dict()
        df = pd.DataFrame([input_data])

        X_processed = fraud_preprocessor.transform(df)
        raw_prediction = fraud_model.predict(X_processed)[0]  # 1 = normal, -1 = anomaly
        raw_score = float(fraud_model.decision_function(X_processed)[0])

        is_anomaly = bool(raw_prediction == -1)

        # Higher raw_score = more normal, so invert for a risk score.
        risk_score = (_FRAUD_SCORE_HIGH - raw_score) / (_FRAUD_SCORE_HIGH - _FRAUD_SCORE_LOW) * 100
        risk_score = float(max(0.0, min(100.0, risk_score)))

        if risk_score < 30:
            risk_level = "Low"
        elif risk_score < 70:
            risk_level = "Medium"
        else:
            risk_level = "High"

        return {
            "success": True,
            "is_anomaly": is_anomaly,
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "raw_anomaly_score": round(raw_score, 5),
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fraud detection failed: {str(e)}")


@app.get("/api/market-forecast/{series}")
def get_market_forecast(series: str, days: int = 30):
    """
    Market Trend Forecaster — Prophet time-series models. series must be
    one of 'stocks', 'gold', 'inflation'. Returns forecasted values with
    80% confidence intervals for the requested horizon.
    """
    if market_models is None:
        raise HTTPException(status_code=503, detail="Market forecast models are not loaded on the server.")
    if series not in market_models:
        raise HTTPException(status_code=404, detail=f"Unknown series '{series}'. Choose from: {list(market_models.keys())}")
    if not (1 <= days <= 365):
        raise HTTPException(status_code=422, detail="days must be between 1 and 365.")

    try:
        model = market_models[series]
        future = model.make_future_dataframe(periods=days)
        forecast = model.predict(future)
        tail = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(days)

        return {
            "success": True,
            "series": series,
            "forecast_horizon_days": days,
            "forecast": [
                {
                    "date": row.ds.strftime("%Y-%m-%d"),
                    "predicted_value": round(row.yhat, 2),
                    "lower_bound": round(row.yhat_lower, 2),
                    "upper_bound": round(row.yhat_upper, 2),
                }
                for row in tail.itertuples()
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Forecast failed: {str(e)}")


@app.post("/api/narrate")
def narrate_result(payload: dict):
    """
    LLM Recommendation Narrator. Accepts the raw JSON output from ANY
    other engine endpoint (predict / tax-saving / rebalance-portfolio /
    detect-fraud) and returns a plain-language explanation. Tries a
    local Ollama call first; falls back to a deterministic template if
    Ollama is unavailable, so this endpoint never fails outright.
    """
    try:
        result = generate_narrative(payload)
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Narration failed: {str(e)}")


@app.post("/api/scan-vulnerability")
def scan_vulnerability(payload: dict, client_id: str = "anonymous", endpoint: str = "unknown"):
    """
    AI-Based Vulnerability Scanner. Combines signature-based injection
    detection (SQLi/XSS/command injection/path traversal) with rate
    anomaly tracking AND a trained IsolationForest anomaly model (when
    loaded) for detecting novel attack patterns that don't match any
    known signature.
    """
    try:
        result = run_vulnerability_scan(
            payload, client_id, endpoint,
            ml_model=vulnerability_model,
            ml_scaler=vulnerability_scaler,
            ml_feature_columns=vulnerability_feature_columns,
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Vulnerability scan failed: {str(e)}")


@app.post("/api/session-risk")
def session_risk(current_session: dict, baseline: Optional[dict] = None):
    """
    Behavioral Biometrics Risk Scorer. Combines per-user baseline
    deviation checks (device/location/time/typing-rhythm) with a
    trained population-level IsolationForest anomaly model — the ML
    model provides coverage even for brand-new users with no personal
    baseline yet.
    """
    try:
        result = compute_session_risk_score(
            current_session, baseline,
            ml_model=behavioral_model,
            ml_scaler=behavioral_scaler,
            ml_feature_columns=behavioral_feature_columns,
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Session risk scoring failed: {str(e)}")


import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"
OLLAMA_TIMEOUT_SECONDS = 15

_CHAT_SYSTEM_PROMPT = (
    "You are a helpful, warm, and highly professional AI wealth advisor for Punjab & Sind Bank (PSB). "
    "Your name is SecureWealth Assistant. You help customers with wealth management, portfolios, "
    "Indian tax saving (Section 80C, 80D, etc.), and transaction security. "
    "STRICT RULES: "
    "1) Answer questions in 2-4 sentences max. Keep it concise. "
    "2) Be friendly, polite, and explain things clearly. "
    "3) If asked about a user's portfolio or specific investments, encourage them to view their dashboard. "
    "4) Never make up facts or give specific advice beyond standard banking guidance."
)


@app.post("/api/ml/chat", response_model=ChatResponse)
def chat_with_advisor(payload: ChatRequest):
    """
    General Chatbot Endpoint. Interacts with the user using the local Ollama LLM,
    providing answers regarding tax saving, portfolio rebalancing, and transaction security.
    Degrades gracefully to rules-based templates if Ollama is unreachable.
    """
    message = payload.message
    history = payload.conversationHistory or []

    # Construct prompt with conversation history context
    full_prompt = f"{_CHAT_SYSTEM_PROMPT}\n\n"
    for msg in history:
        role_label = "Customer" if msg.role == "user" else "Assistant"
        full_prompt += f"{role_label}: {msg.content}\n"
    full_prompt += f"Customer: {message}\nAssistant:"

    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": full_prompt, "stream": False},
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        if response.status_code == 200:
            data = response.json()
            text = data.get("response", "").strip()
            if text:
                return ChatResponse(response=text)
    except Exception:
        pass

    # Rules-based fallback if Ollama is not running/available
    msg_lower = message.lower() if hasattr(message, "lower") else str(message).lower()

    reply = "I'm currently running in offline helper mode. I can suggest setting up financial goals or analyzing your tax liabilities. What would you like to check?"
    if "tax" in msg_lower:
        reply = "Under Section 80C, you can invest up to ₹1.5 Lakhs in ELSS funds, PPF, or PSB Fixed Deposits to save tax. If that is maxed out, consider National Pension System (NPS) under Section 80CCD(1B) for an additional ₹50,000 deduction."
    elif "portfolio" in msg_lower or "investment" in msg_lower or "net worth" in msg_lower:
        reply = "I recommend checking the 'Portfolio' tab on your dashboard. It displays a live view of your assets and active investments (like SIPs and Fixed Deposits)."
    elif "goal" in msg_lower:
        reply = "You can define target milestones (like a Retirement Corpus or Travel Fund) on the dashboard, and see simulated Monte Carlo projections of your savings progress."
    elif "fraud" in msg_lower or "security" in msg_lower or "blocked" in msg_lower:
        reply = "Our Security Twin monitors transaction risk. If a transaction has high velocity or comes from an unrecognized device, it will be flagged for your protection. You can review all logs in the Security Audit Log."

    return ChatResponse(response=reply)