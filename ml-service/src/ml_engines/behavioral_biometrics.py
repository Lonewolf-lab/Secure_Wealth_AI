"""
Secure Wealth Twin — Behavioral Biometrics Risk Scorer
==========================================================
Scores a login/session's risk based on deviation from the user's own
established behavioral baseline — device, location, typing rhythm, and
login-time patterns. This is the "continuous risk-based authentication"
layer from the Security Twin (Section D of the blueprint): the mechanism
that decides whether a session needs step-up verification instead of
relying on a single static OTP check.

Approach: per-user Z-SCORE deviation against a stored baseline, rather
than a pre-trained Isolation Forest. This is a deliberate speed/quality
tradeoff given the build timeline — it requires NO training data or
training step (works from the very first session onward), is fully
interpretable (every flagged factor is individually explainable to a
user or auditor), and is extensible: swap in a trained IsolationForest
per-user later without changing the API contract, once enough real
session history exists to train on.
"""

from typing import Any, Optional, TypedDict


class BehavioralRiskResult(TypedDict):
    risk_score: float
    risk_level: str
    flagged_factors: list[str]
    requires_step_up_auth: bool


# Risk score threshold above which step-up authentication (e.g. a second
# passkey touch, per the blueprint's WebAuthn design) should be triggered.
STEP_UP_THRESHOLD = 50.0


def score_with_ml_model(current_session: dict[str, Any], model, scaler, feature_columns: list[str]) -> dict[str, Any]:
    """
    Scores the session against the POPULATION-level trained IsolationForest.
    This works even for brand-new users with no personal baseline yet —
    complementary to compute_session_risk_score's per-user check.
    Missing fields default to a neutral/typical value rather than failing.
    """
    if model is None or scaler is None:
        return {"ml_available": False, "ml_is_anomaly": False, "ml_risk_score": None}

    defaults = {
        "typing_speed_wpm": 45.0,
        "keystroke_interval_std_ms": 80.0,
        "session_duration_sec": 300.0,
        "login_hour": 12,
        "geo_distance_from_home_km": 5.0,
        "failed_pin_attempts": 0,
        "device_change_flag": 0,
    }

    try:
        import numpy as np
        features = [current_session.get(col, defaults[col]) for col in feature_columns]
        X = np.array([features])
        X_scaled = scaler.transform(X)
        raw_pred = model.predict(X_scaled)[0]
        raw_score = float(model.decision_function(X_scaled)[0])
        is_anomaly = bool(raw_pred == -1)
        risk_score = max(0.0, min(100.0, (0.15 - raw_score) / 0.30 * 100))
        return {"ml_available": True, "ml_is_anomaly": is_anomaly, "ml_risk_score": round(risk_score, 2)}
    except Exception:
        return {"ml_available": False, "ml_is_anomaly": False, "ml_risk_score": None}


def compute_session_risk_score(
    current_session: dict[str, Any],
    baseline: Optional[dict[str, Any]] = None,
    ml_model=None,
    ml_scaler=None,
    ml_feature_columns: Optional[list[str]] = None,
) -> BehavioralRiskResult:
    """
    Compares the current session's behavioral signals against the user's
    established baseline. If no baseline exists (first-ever session),
    returns a low, non-blocking risk score — you can't be "anomalous"
    against a baseline that doesn't exist yet.

    Args:
        current_session: dict with keys:
            - device_fingerprint (str)
            - login_hour (int, 0-23)
            - city (str)
            - typing_speed_wpm (float, optional)
        baseline: dict with the user's historical TYPICAL values:
            - known_device_fingerprints (list[str])
            - typical_login_hours (list[int]) — e.g. hours they usually log in
            - known_cities (list[str])
            - avg_typing_speed_wpm (float, optional)
            - typing_speed_std_wpm (float, optional)

    Returns:
        BehavioralRiskResult — risk_score 0-100, flagged factors, and
        whether step-up auth should be triggered.
    """
    ml_result = {"ml_available": False, "ml_is_anomaly": False, "ml_risk_score": None}
    if ml_model is not None and ml_feature_columns is not None:
        ml_result = score_with_ml_model(current_session, ml_model, ml_scaler, ml_feature_columns)

    if baseline is None:
        # No personal baseline yet — lean entirely on the population-level
        # ML model if available, since there's nothing to compare against.
        if ml_result["ml_available"]:
            score = ml_result["ml_risk_score"]
            flags = ["No personal baseline yet — scored against population-level behavior model."]
            if ml_result["ml_is_anomaly"]:
                flags.append("Session flagged as statistically unusual compared to typical sessions.")
        else:
            score = 10.0
            flags = ["No baseline yet — this is treated as a new/first session."]

        risk_level = "Low" if score < 30 else ("Medium" if score < 60 else "High")
        return BehavioralRiskResult(
            risk_score=round(score, 2),
            risk_level=risk_level,
            flagged_factors=flags,
            requires_step_up_auth=score >= STEP_UP_THRESHOLD,
        )

    score = 0.0
    flagged_factors: list[str] = []

    # --- Device check ---
    known_devices = baseline.get("known_device_fingerprints", [])
    current_device = current_session.get("device_fingerprint")
    if known_devices and current_device not in known_devices:
        score += 35.0
        flagged_factors.append("Unrecognized device — does not match any known device fingerprint.")

    # --- Location check ---
    known_cities = baseline.get("known_cities", [])
    current_city = current_session.get("city")
    if known_cities and current_city not in known_cities:
        score += 30.0
        flagged_factors.append(f"Unrecognized location ('{current_city}') — outside known cities.")

    # --- Login-time check ---
    typical_hours = baseline.get("typical_login_hours", [])
    current_hour = current_session.get("login_hour")
    if typical_hours and current_hour is not None:
        # "Close enough" = within 2 hours of any historically typical hour
        is_typical_time = any(
            min(abs(current_hour - h), 24 - abs(current_hour - h)) <= 2
            for h in typical_hours
        )
        if not is_typical_time:
            score += 20.0
            flagged_factors.append(
                f"Login at unusual hour ({current_hour}:00) — outside the user's typical login window."
            )

    # --- Typing rhythm check (z-score against baseline mean/std) ---
    avg_wpm = baseline.get("avg_typing_speed_wpm")
    std_wpm = baseline.get("typing_speed_std_wpm")
    current_wpm = current_session.get("typing_speed_wpm")
    if avg_wpm is not None and std_wpm and std_wpm > 0 and current_wpm is not None:
        z_score = abs(current_wpm - avg_wpm) / std_wpm
        if z_score > 2.5:  # more than 2.5 standard deviations from the norm
            score += 15.0
            flagged_factors.append(
                f"Typing rhythm deviates significantly from baseline (z-score {z_score:.2f})."
            )

    score = min(score, 100.0)

    # Blend in the ML population-level score if available — take the max
    # of the two signals (more conservative: either check raising a flag
    # is enough to raise the combined risk score).
    if ml_result["ml_available"] and ml_result["ml_risk_score"] > score:
        score = ml_result["ml_risk_score"]
        if ml_result["ml_is_anomaly"]:
            flagged_factors.append("Population-level behavior model also flagged this session as unusual.")

    if score < 30:
        risk_level = "Low"
    elif score < 60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    if not flagged_factors:
        flagged_factors.append("Session matches established behavioral baseline.")

    return BehavioralRiskResult(
        risk_score=round(score, 2),
        risk_level=risk_level,
        flagged_factors=flagged_factors,
        requires_step_up_auth=score >= STEP_UP_THRESHOLD,
    )