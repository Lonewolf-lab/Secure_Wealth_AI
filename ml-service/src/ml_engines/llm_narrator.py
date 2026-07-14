"""
Secure Wealth Twin — LLM Recommendation Narrator
====================================================
Synthesizes structured output from the OTHER engines (investment
predictor, tax engine, portfolio rebalancer) into a plain-language
explanation for the end user. Per the architecture blueprint (Section B):
the LLM's job is to EXPLAIN numbers that already exist, never to
independently decide or invent a number itself.

Uses a LOCAL Ollama instance (matches the rest of this project's LLM
usage pattern — free tier, no API key, works offline for a demo).

CRITICAL DESIGN CHOICE: fail-soft fallback. If Ollama isn't running,
times out, or errors, this falls back to a deterministic TEMPLATE
narrative built directly from the structured data — the endpoint never
crashes just because the LLM layer is unavailable, and the fallback
narrative is still accurate (just less fluent) since it's built from
the same real numbers.
"""

import json
from typing import Any, Optional

import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"  
                            # (e.g. "mistral", "llama3.1") if different
OLLAMA_TIMEOUT_SECONDS = 15

_SYSTEM_PROMPT = (
    "You are a financial explanation assistant for an Indian bank's wealth "
    "management app. You will be given structured JSON data containing an "
    "investment recommendation, tax analysis, and/or portfolio rebalancing "
    "output that has ALREADY been computed and validated by deterministic "
    "systems. Your ONLY job is to explain these results in clear, warm, "
    "plain language for a non-expert user. "
    "STRICT RULES: "
    "1) NEVER invent, guess, or alter any number — only restate figures "
    "exactly as given in the JSON. "
    "2) NEVER give financial advice beyond what the JSON already contains. "
    "3) Keep the explanation to 3-5 short sentences. "
    "4) Do not mention that you are an AI or that this is JSON data — write "
    "as if you are a helpful advisor summarizing a report."
)


def _call_ollama(context: dict[str, Any]) -> Optional[str]:
    """Attempts a real LLM call. Returns None on ANY failure (timeout,
    connection refused, malformed response) so the caller can fall back
    cleanly — this function is intentionally allowed to fail silently."""
    prompt = (
        f"{_SYSTEM_PROMPT}\n\n"
        f"Here is the data to explain:\n{json.dumps(context, indent=2)}\n\n"
        f"Write the explanation now:"
    )
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        text = data.get("response", "").strip()
        return text if text else None
    except Exception:
        return None


def _template_fallback(context: dict[str, Any]) -> str:
    """
    Deterministic, rule-based narrative built directly from whatever
    fields are present in context. Used whenever the LLM call fails —
    less fluent, but always accurate since it only echoes real numbers.
    """
    parts = []

    if "recommended_asset_class" in context:
        asset = context["recommended_asset_class"]
        source = context.get("source", "our analysis")
        parts.append(f"Based on {source.replace('_', ' ')}, we recommend {asset} as your primary asset class.")
        reason = context.get("reason")
        if reason:
            parts.append(f"This is because: {reason}")

    if "total_tax_payable_inr" in context:
        tax = context["total_tax_payable_inr"]
        regime = context.get("regime_evaluated", "the selected")
        parts.append(f"Under the {regime} tax regime, your estimated total tax payable is ₹{tax:,.0f}.")
        recommended_regime = context.get("recommended_regime")
        if recommended_regime and recommended_regime != regime:
            parts.append(f"You may save more tax by switching to the {recommended_regime} regime instead.")

    if "recommended_weights" in context:
        weights = context["recommended_weights"]
        top_asset = max(weights, key=weights.get)
        parts.append(
            f"For your risk profile, the optimal portfolio allocates "
            f"{weights[top_asset]:.1f}% to {top_asset}, "
            f"with an expected return of {context.get('expected_return_pct', 'N/A')}%."
        )

    if "risk_score" in context and "risk_level" in context:
        parts.append(
            f"This transaction has a {context['risk_level'].lower()} risk score "
            f"of {context['risk_score']}/100."
        )

    if not parts:
        parts.append("Here is a summary of your requested analysis based on the figures provided.")

    return " ".join(parts)


def generate_narrative(context: dict[str, Any]) -> dict[str, Any]:
    """
    Main entry point. Tries a real LLM call first; falls back to the
    deterministic template on any failure. Always returns successfully —
    this function should never raise.

    Args:
        context: any dict of already-computed results from another
            engine (investment prediction, tax analysis, portfolio
            rebalance, or fraud detection output).

    Returns:
        {"narrative": str, "source": "llm" | "template_fallback"}
    """
    llm_result = _call_ollama(context)
    if llm_result is not None:
        return {"narrative": llm_result, "source": "llm"}

    return {"narrative": _template_fallback(context), "source": "template_fallback"}