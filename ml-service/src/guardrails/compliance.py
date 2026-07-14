"""
Secure Wealth Twin — Deterministic Compliance Guardrail
==========================================================
This is the "Guardrail Layer" from the architecture blueprint (Section C).
It has TWO stages, matching the full precision strategy, not just the
pre-inference rule check:

  STAGE 1 — validate_financial_guardrails(input_data)
      Runs BEFORE the ML model ever sees the request. Pure deterministic
      rules. If any rule fires, the model is never even called.

  STAGE 2 — validate_prediction_confidence(class_probabilities)
      Runs AFTER the ML model produces a prediction, BEFORE it reaches
      the user. If the model itself is not confident, we don't trust its
      guess — we abstain and fall back to the safe default instead.
      This is the "it's safer to say I don't know than guess wrong"
      principle from the blueprint.

  AUDIT TRAIL — log_decision(...)
      Every request that passes through either stage is appended to an
      immutable, timestamped log file. This is what makes the "wrong
      recommendation never reaches the customer" claim auditable rather
      than just asserted — a real PSB compliance reviewer could replay
      this log end to end.

Both stages return the same GuardrailResult shape so main.py can treat
them uniformly.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional, TypedDict


class GuardrailResult(TypedDict):
    is_compliant: bool
    fallback_asset_class: Optional[str]
    reason: Optional[str]


# Conservative, capital-preservation-first fallback used whenever a rule
# fires or the model's confidence is too low to trust. Bonds are the
# safest asset class in our label set — an appropriate "do no harm"
# default when the model's raw output can't be trusted outright.
DEFAULT_SAFE_FALLBACK = "Bonds"

# Below this confidence, the model's own top prediction is not trusted
# and we fall back to the safe default instead of showing it to the user.
MIN_PREDICTION_CONFIDENCE = 0.55

# ---------------------------------------------------------------------------
# AUDIT LOG SETUP
# Resolved relative to this file's location: src/guardrails/compliance.py
# -> project_root/logs/guardrail_audit_log.jsonl
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_LOG_DIR = _PROJECT_ROOT / "logs"
_LOG_FILE = _LOG_DIR / "guardrail_audit_log.jsonl"


def log_decision(stage: str, input_data: dict[str, Any], result: GuardrailResult) -> None:
    """
    Appends a single audit record to logs/guardrail_audit_log.jsonl.

    Uses JSON Lines format (one JSON object per line) so the log can be
    tailed, streamed, or parsed incrementally without ever needing to
    load/rewrite the whole file — appropriate for an append-only audit
    trail that should never be edited in place.

    This function is intentionally fail-soft: if logging itself fails
    (e.g. disk full, permissions issue), it prints a warning rather than
    crashing the request — an audit log outage should never take down
    the actual recommendation service.
    """
    try:
        _LOG_DIR.mkdir(parents=True, exist_ok=True)
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stage": stage,  # "pre_inference_rules" or "post_inference_confidence"
            "input": input_data,
            "is_compliant": result["is_compliant"],
            "fallback_asset_class": result["fallback_asset_class"],
            "reason": result["reason"],
        }
        with open(_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    except Exception as e:
        print(f"⚠️  Audit logging failed (request still proceeds): {e}")


def validate_financial_guardrails(input_data: dict[str, Any]) -> GuardrailResult:
    """
    STAGE 1 — Deterministic pre-inference safety checks against a user's
    financial profile. If ANY rule fires, the caller must return the
    fallback asset class immediately and skip the ML model entirely.

    Args:
        input_data: dict matching InvestmentRequest fields, e.g.
            {"Age": 29, "Annual_Income_INR": 1800000, ...}

    Returns:
        GuardrailResult — is_compliant=False means STOP, use fallback.
    """
    age = input_data.get("Age", 0)
    risk_score = input_data.get("Risk_Appetite_Score", 0)
    horizon_months = input_data.get("Investment_Horizon_Months", 0)
    disposable_income = input_data.get("Monthly_Disposable_Income_INR", 0)
    savings = input_data.get("Current_Savings_INR", 0)
    income = input_data.get("Annual_Income_INR", 0)
    goal = input_data.get("Financial_Goal", "")
    tax_bracket = input_data.get("Tax_Bracket", "")

    result: GuardrailResult

    # ------------------------------------------------------------------
    # RULE 1: No disposable income -> cannot responsibly recommend
    # putting money into ANY new investment.
    # ------------------------------------------------------------------
    if disposable_income <= 0:
        result = GuardrailResult(
            is_compliant=False,
            fallback_asset_class=DEFAULT_SAFE_FALLBACK,
            reason="No positive monthly disposable income — new investment not advisable.",
        )
        log_decision("pre_inference_rules", input_data, result)
        return result

    # ------------------------------------------------------------------
    # RULE 2: Elderly + high-risk-appetite combination — classic
    # suitability violation in real advisory compliance.
    # ------------------------------------------------------------------
    if age >= 60 and risk_score >= 8:
        result = GuardrailResult(
            is_compliant=False,
            fallback_asset_class=DEFAULT_SAFE_FALLBACK,
            reason="Age 60+ combined with high self-reported risk appetite — "
                   "capital preservation prioritized over stated risk tolerance.",
        )
        log_decision("pre_inference_rules", input_data, result)
        return result

    # ------------------------------------------------------------------
    # RULE 3: High risk appetite + very short horizon — volatility vs.
    # near-term liquidity mismatch.
    # ------------------------------------------------------------------
    if risk_score >= 8 and horizon_months < 12:
        result = GuardrailResult(
            is_compliant=False,
            fallback_asset_class=DEFAULT_SAFE_FALLBACK,
            reason="High risk appetite with under-12-month horizon — "
                   "volatility mismatch against near-term liquidity needs.",
        )
        log_decision("pre_inference_rules", input_data, result)
        return result

    # ------------------------------------------------------------------
    # RULE 4: Savings-to-income sanity check — protects against acting
    # on internally inconsistent or erroneous input data.
    # ------------------------------------------------------------------
    if income > 0 and savings > income * 50:
        result = GuardrailResult(
            is_compliant=False,
            fallback_asset_class=DEFAULT_SAFE_FALLBACK,
            reason="Reported savings inconsistent with reported income — "
                   "flagged for manual review rather than automated recommendation.",
        )
        log_decision("pre_inference_rules", input_data, result)
        return result

    # ------------------------------------------------------------------
    # RULE 5: Retirement goal + very short horizon is contradictory —
    # retirement planning implies a long runway by definition. Likely a
    # data entry mismatch; don't let the model act on it silently.
    # ------------------------------------------------------------------
    if goal == "Retirement" and horizon_months < 24:
        result = GuardrailResult(
            is_compliant=False,
            fallback_asset_class=DEFAULT_SAFE_FALLBACK,
            reason="Retirement goal declared with under-24-month horizon — "
                   "inputs are contradictory, defaulting to conservative option.",
        )
        log_decision("pre_inference_rules", input_data, result)
        return result

    # ------------------------------------------------------------------
    # RULE 6: Zero tax bracket ('0%') with a "Tax Saving" goal — there is
    # no tax liability to offset, so a tax-saving instrument recommendation
    # would be actively unhelpful/misleading for this user.
    # ------------------------------------------------------------------
    if tax_bracket == "0%" and goal == "Tax Saving":
        result = GuardrailResult(
            is_compliant=False,
            fallback_asset_class=DEFAULT_SAFE_FALLBACK,
            reason="User is in the 0% tax bracket — tax-saving instruments "
                   "provide no benefit; defaulting to a general safe option.",
        )
        log_decision("pre_inference_rules", input_data, result)
        return result

    # ------------------------------------------------------------------
    # RULE 7: Low disposable income combined with a high-risk short-term
    # speculation goal — guards against encouraging risky short-term
    # speculation with insufficient financial cushion.
    # ------------------------------------------------------------------
    if goal == "Short-term Gain" and disposable_income < 5000 and risk_score >= 7:
        result = GuardrailResult(
            is_compliant=False,
            fallback_asset_class=DEFAULT_SAFE_FALLBACK,
            reason="Low disposable income with high-risk short-term speculation goal — "
                   "insufficient financial cushion, defaulting to conservative option.",
        )
        log_decision("pre_inference_rules", input_data, result)
        return result

    # All checks passed — safe to proceed to the ML model.
    result = GuardrailResult(is_compliant=True, fallback_asset_class=None, reason=None)
    log_decision("pre_inference_rules", input_data, result)
    return result


def validate_prediction_confidence(
    input_data: dict[str, Any],
    class_probabilities: dict[str, float],
    min_confidence: float = MIN_PREDICTION_CONFIDENCE,
) -> GuardrailResult:
    """
    STAGE 2 — Runs AFTER the ML model has produced a prediction. Checks
    whether the model's own confidence in its top choice clears a minimum
    bar. If not, we don't show the user a low-confidence guess — we
    abstain and fall back to the safe default instead.

    Args:
        input_data: the original request, logged alongside the decision
            for audit purposes.
        class_probabilities: e.g. {"Bonds": 0.12, "Equity/Stocks": 0.48, ...}
        min_confidence: threshold below which we no longer trust the
            model's top prediction.

    Returns:
        GuardrailResult — is_compliant=False means the model's prediction
        should be DISCARDED in favor of fallback_asset_class.
    """
    if not class_probabilities:
        result = GuardrailResult(
            is_compliant=False,
            fallback_asset_class=DEFAULT_SAFE_FALLBACK,
            reason="No probability distribution returned by model — defaulting to safe option.",
        )
        log_decision("post_inference_confidence", input_data, result)
        return result

    top_confidence = max(class_probabilities.values())

    if top_confidence < min_confidence:
        result = GuardrailResult(
            is_compliant=False,
            fallback_asset_class=DEFAULT_SAFE_FALLBACK,
            reason=f"Model confidence ({top_confidence:.2f}) below minimum threshold "
                   f"({min_confidence:.2f}) — abstaining in favor of conservative default.",
        )
        log_decision("post_inference_confidence", input_data, result)
        return result

    result = GuardrailResult(is_compliant=True, fallback_asset_class=None, reason=None)
    log_decision("post_inference_confidence", input_data, result)
    return result