"""
Secure Wealth Twin — Tax Saving Rules Engine
================================================
DELIBERATELY NOT ML. Per the architecture blueprint (Section B), tax law
is not probabilistic — using a model here would be a liability, not a
feature, since a hallucinated tax suggestion could get flagged in a real
bank audit. This is a pure, deterministic rules engine: same input always
produces the same output, and every number is traceable to a specific
tax section.

Supports BOTH regimes, since Indian taxpayers can choose either each
year (non-business filers):
  - OLD regime: higher slabs, but many deductions available (80C/80D/NPS)
  - NEW regime: lower slabs, almost no deductions, but simpler

Slab rates below reflect FY 2025-26 / AY 2026-27 (Budget 2025, explicitly
retained unchanged by Budget 2026 as of this writing). Tax law changes
with each Union Budget — if you're demoing this after another budget
cycle, verify these figures haven't shifted again.

SIMPLIFICATIONS (stated explicitly, not hidden — be ready to say this to
judges if asked):
  - Surcharge for very high incomes (>50L) is NOT modeled (flat slab tax
    + cess only). Real liability at very high incomes would be higher.
  - Assumes the user has NOT yet utilized any 80C/80D/NPS headroom
    (no "existing investments" field exists in our schema yet) — so
    instrument recommendations show FULL available headroom, not
    remaining headroom after existing investments.
  - HRA and home loan interest (Section 24b) are not modeled — no rent/
    loan data exists in our current schema.
"""

from typing import Any, Literal, TypedDict

Regime = Literal["old", "new"]


class TaxInstrument(TypedDict):
    name: str
    section: str
    max_limit_inr: float
    note: str


class TaxAnalysisResult(TypedDict):
    regime_evaluated: Regime
    gross_annual_income_inr: float
    standard_deduction_inr: float
    taxable_income_inr: float
    tax_before_cess_inr: float
    cess_inr: float
    total_tax_payable_inr: float
    rebate_applied: bool
    recommended_instruments: list[TaxInstrument]
    estimated_max_tax_saved_inr: float
    comparison: dict[str, float]
    recommended_regime: Regime
    disclaimer: str


CESS_RATE = 0.04  # Health & Education cess, both regimes

_DISCLAIMER = (
    "Illustrative estimate based on FY 2025-26 slabs. Does not model surcharge "
    "for income above ₹50L, HRA, home loan interest, or existing investments "
    "already utilized. Consult a tax advisor for filing decisions."
)


def _apply_slabs(taxable_income: float, slabs: list[tuple[float, float, float]]) -> float:
    """
    slabs: list of (lower_bound, upper_bound, rate) tuples, upper_bound
    can be float('inf') for the top slab. Computes tax progressively —
    each slab's rate applies ONLY to the income within that band.
    """
    tax = 0.0
    for lower, upper, rate in slabs:
        if taxable_income > lower:
            taxable_in_band = min(taxable_income, upper) - lower
            tax += taxable_in_band * rate
        else:
            break
    return tax


def _compute_new_regime_tax(gross_income: float) -> dict[str, float]:
    standard_deduction = 75_000.0
    taxable_income = max(0.0, gross_income - standard_deduction)

    slabs = [
        (0, 400_000, 0.00),
        (400_000, 800_000, 0.05),
        (800_000, 1_200_000, 0.10),
        (1_200_000, 1_600_000, 0.15),
        (1_600_000, 2_000_000, 0.20),
        (2_000_000, 2_400_000, 0.25),
        (2_400_000, float("inf"), 0.30),
    ]
    tax_before_rebate = _apply_slabs(taxable_income, slabs)

    # Section 87A rebate: taxable income up to 12L -> effective zero tax
    rebate_applied = taxable_income <= 1_200_000
    tax_after_rebate = 0.0 if rebate_applied else tax_before_rebate

    cess = tax_after_rebate * CESS_RATE
    total_tax = tax_after_rebate + cess

    return {
        "standard_deduction": standard_deduction,
        "taxable_income": taxable_income,
        "tax_before_cess": round(tax_after_rebate, 2),
        "cess": round(cess, 2),
        "total_tax": round(total_tax, 2),
        "rebate_applied": rebate_applied,
    }


def _compute_old_regime_tax(gross_income: float, deductions_claimed: float = 0.0) -> dict[str, float]:
    standard_deduction = 50_000.0
    taxable_income = max(0.0, gross_income - standard_deduction - deductions_claimed)

    slabs = [
        (0, 250_000, 0.00),
        (250_000, 500_000, 0.05),
        (500_000, 1_000_000, 0.20),
        (1_000_000, float("inf"), 0.30),
    ]
    tax_before_rebate = _apply_slabs(taxable_income, slabs)

    # Section 87A rebate: taxable income up to 5L -> effective zero tax
    rebate_applied = taxable_income <= 500_000
    tax_after_rebate = 0.0 if rebate_applied else tax_before_rebate

    cess = tax_after_rebate * CESS_RATE
    total_tax = tax_after_rebate + cess

    return {
        "standard_deduction": standard_deduction,
        "taxable_income": taxable_income,
        "tax_before_cess": round(tax_after_rebate, 2),
        "cess": round(cess, 2),
        "total_tax": round(total_tax, 2),
        "rebate_applied": rebate_applied,
    }


def _get_old_regime_instruments(age: int) -> list[TaxInstrument]:
    """Fixed, deterministic instrument list for the old regime. Amounts are
    the FULL statutory limits — see disclaimer re: not netting out any
    existing investments (we don't collect that data yet)."""
    instruments: list[TaxInstrument] = [
        TaxInstrument(
            name="ELSS Mutual Funds / PPF / EPF / Life Insurance Premium",
            section="80C",
            max_limit_inr=150_000.0,
            note="Combined limit across all 80C instruments — pick based on liquidity "
                 "need (ELSS: 3-yr lock-in, PPF: 15-yr, EPF: retirement-linked).",
        ),
        TaxInstrument(
            name="NPS (National Pension System) — additional voluntary contribution",
            section="80CCD(1B)",
            max_limit_inr=50_000.0,
            note="Stacks ON TOP of the 80C limit — a distinct additional deduction.",
        ),
        TaxInstrument(
            name="Health Insurance Premium (self + family)",
            section="80D",
            max_limit_inr=25_000.0 if age < 60 else 50_000.0,
            note="Limit rises to ₹50,000 for senior citizens (60+). A separate "
                 "₹25,000-50,000 is available if also paying for senior-citizen parents.",
        ),
    ]
    return instruments


def analyze_tax_situation(
    input_data: dict[str, Any],
    regime: Regime = "new",
    deductions_claimed_old_regime: float = 0.0,
) -> TaxAnalysisResult:
    """
    Main entry point. Computes tax liability under the REQUESTED regime,
    but ALSO computes the other regime for comparison — this is the
    "which regime should I even pick" recommendation, which is often more
    valuable to a user than the raw tax number alone.

    Args:
        input_data: dict with at least "Age" and "Annual_Income_INR"
            (matches InvestmentRequest fields, so this can reuse the
            same payload as the investment endpoint).
        regime: which regime the user currently wants evaluated ("old" or "new").
        deductions_claimed_old_regime: if the user already knows how much
            80C/80D/NPS they plan to claim, pass it here to get a more
            accurate old-regime number. Defaults to 0 (full headroom
            shown as an opportunity, not yet claimed).

    Returns:
        TaxAnalysisResult — full breakdown for the requested regime, plus
        a regime comparison and instrument recommendations.
    """
    age = int(input_data.get("Age", 30))
    gross_income = float(input_data.get("Annual_Income_INR", 0))

    new_result = _compute_new_regime_tax(gross_income)
    old_result = _compute_old_regime_tax(gross_income, deductions_claimed_old_regime)

    # Also compute old regime AT FULL 80C+80D+NPS utilization, to show the
    # user the best-case tax saving achievable if they max out instruments.
    max_possible_deductions = 150_000.0 + 50_000.0 + (25_000.0 if age < 60 else 50_000.0)
    old_result_maxed = _compute_old_regime_tax(gross_income, max_possible_deductions)

    comparison = {
        "new_regime_tax_inr": new_result["total_tax"],
        "old_regime_tax_inr_no_deductions": old_result["total_tax"],
        "old_regime_tax_inr_fully_maxed": old_result_maxed["total_tax"],
    }

    # Recommend whichever regime is cheaper for THIS user, assuming they
    # WOULD max out old-regime deductions if they went that route — this
    # is the realistic comparison a taxpayer actually cares about.
    recommended_regime: Regime = (
        "old" if old_result_maxed["total_tax"] < new_result["total_tax"] else "new"
    )

    active_result = new_result if regime == "new" else old_result
    recommended_instruments = _get_old_regime_instruments(age) if regime == "old" else []

    estimated_max_tax_saved = round(
        old_result["total_tax"] - old_result_maxed["total_tax"], 2
    ) if regime == "old" else 0.0

    return TaxAnalysisResult(
        regime_evaluated=regime,
        gross_annual_income_inr=gross_income,
        standard_deduction_inr=active_result["standard_deduction"],
        taxable_income_inr=active_result["taxable_income"],
        tax_before_cess_inr=active_result["tax_before_cess"],
        cess_inr=active_result["cess"],
        total_tax_payable_inr=active_result["total_tax"],
        rebate_applied=active_result["rebate_applied"],
        recommended_instruments=recommended_instruments,
        estimated_max_tax_saved_inr=estimated_max_tax_saved,
        comparison=comparison,
        recommended_regime=recommended_regime,
        disclaimer=_DISCLAIMER,
    )