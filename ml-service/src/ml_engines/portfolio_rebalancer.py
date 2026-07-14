"""
Secure Wealth Twin — Portfolio Rebalancing Engine
=====================================================
DELIBERATELY NOT a classifier. Per the architecture blueprint (Section B),
portfolio rebalancing is a constrained OPTIMIZATION problem, not a
prediction problem — Mean-Variance Optimization (Modern Portfolio Theory,
Markowitz 1952) gives a mathematically provable optimal allocation for a
given risk tolerance, which an ML classifier guessing "buy/sell" cannot.

This module:
  1. Defines expected return/volatility per asset class (reusing the SAME
     return bands as the synthetic data generator, for internal
     consistency across the whole project).
  2. Builds a covariance matrix from a realistic correlation structure.
  3. Computes the efficient frontier (the set of portfolios that give the
     maximum return for each level of risk).
  4. Maps a user's 1-10 Risk_Appetite_Score onto a specific point on that
     frontier, returning the exact recommended weights.
  5. If given a user's CURRENT allocation, produces concrete rebalancing
     actions (buy/sell deltas per asset) to move them onto the frontier.

Asset order matches the LabelEncoder's alphabetical ordering used
elsewhere in the project (Bonds, Equity/Stocks, Gold, Mutual Funds) so
outputs from this engine and the XGBoost predictor use the same asset
class vocabulary.
"""

from typing import Any, Optional, TypedDict

import numpy as np
from scipy.optimize import minimize

ASSET_CLASSES = ["Bonds", "Equity/Stocks", "Gold", "Mutual Funds"]

# Expected annual return (%) and volatility (%) per asset class. These
# intentionally mirror the roi_bands used in generate_synthetic_data.py,
# so the whole project tells one consistent financial story rather than
# using unrelated assumptions in different modules.
EXPECTED_RETURNS_PCT = {
    "Bonds": 5.5,
    "Equity/Stocks": 14.5,
    "Gold": 8.0,
    "Mutual Funds": 11.5,
}
VOLATILITY_PCT = {
    "Bonds": 1.2,
    "Equity/Stocks": 8.5,
    "Gold": 3.0,
    "Mutual Funds": 4.5,
}

# Illustrative correlation matrix reflecting realistic asset relationships:
#   - Equity & Mutual Funds are highly correlated (funds are often equity-heavy)
#   - Gold is a classic hedge — low/negative correlation with Equity
#   - Bonds are largely uncorrelated with growth assets
# Order matches ASSET_CLASSES exactly.
CORRELATION_MATRIX = np.array([
    #  Bonds   Equity   Gold    MutualFunds
    [  1.00,  -0.10,   0.10,   0.00],   # Bonds
    [ -0.10,   1.00,  -0.20,   0.85],   # Equity/Stocks
    [  0.10,  -0.20,   1.00,  -0.10],   # Gold
    [  0.00,   0.85,  -0.10,   1.00],   # Mutual Funds
])

RISK_FREE_RATE_PCT = 4.0  # Approximate short-term liquid/savings benchmark, for Sharpe ratio calc.
# NOTE: deliberately NOT the 10-yr G-Sec yield (~6.5%) — that would sit
# ABOVE our own "Bonds" asset class's assumed return (5.5%), which would
# make even the most conservative portfolio show a negative Sharpe ratio.
# A short-term liquid benchmark is the more standard choice here.


class PortfolioResult(TypedDict):
    risk_appetite_score: int
    target_return_pct: float
    recommended_weights: dict[str, float]
    expected_return_pct: float
    expected_volatility_pct: float
    sharpe_ratio: float
    efficient_frontier: list[dict[str, float]]
    rebalancing_actions: Optional[list[dict[str, Any]]]
    disclaimer: str


_DISCLAIMER = (
    "Based on illustrative long-term expected returns and volatility per asset "
    "class, not live market data. Efficient frontier computed via Mean-Variance "
    "Optimization (Markowitz). Past performance does not guarantee future returns."
)


def _build_covariance_matrix() -> np.ndarray:
    """Converts the correlation matrix + per-asset volatilities into a
    covariance matrix: Cov(i,j) = Corr(i,j) * Vol(i) * Vol(j)."""
    vols = np.array([VOLATILITY_PCT[a] for a in ASSET_CLASSES])
    return CORRELATION_MATRIX * np.outer(vols, vols)


def _portfolio_performance(weights: np.ndarray, returns: np.ndarray, cov: np.ndarray) -> tuple[float, float]:
    """Returns (expected_return_pct, volatility_pct) for a given weight vector."""
    port_return = float(np.dot(weights, returns))
    port_variance = float(np.dot(weights.T, np.dot(cov, weights)))
    port_volatility = float(np.sqrt(max(port_variance, 0.0)))
    return port_return, port_volatility


def _minimize_volatility_for_target_return(
    target_return: float, returns: np.ndarray, cov: np.ndarray
) -> Optional[np.ndarray]:
    """
    Solves: minimize portfolio variance, subject to
      - weights sum to 1 (fully invested, no leverage)
      - portfolio expected return == target_return
      - no short-selling (all weights >= 0)
    Returns None if the target return is infeasible given the asset universe.
    """
    n = len(returns)
    initial_guess = np.repeat(1.0 / n, n)
    bounds = tuple((0.0, 1.0) for _ in range(n))
    constraints = [
        {"type": "eq", "fun": lambda w: np.sum(w) - 1.0},
        {"type": "eq", "fun": lambda w: np.dot(w, returns) - target_return},
    ]

    def objective(w):
        return np.dot(w.T, np.dot(cov, w))

    result = minimize(
        objective, initial_guess, method="SLSQP", bounds=bounds, constraints=constraints
    )
    return result.x if result.success else None


def _get_min_variance_portfolio(returns: np.ndarray, cov: np.ndarray) -> np.ndarray:
    """The leftmost point on the efficient frontier — lowest possible
    volatility achievable across the asset universe, regardless of return."""
    n = len(returns)
    initial_guess = np.repeat(1.0 / n, n)
    bounds = tuple((0.0, 1.0) for _ in range(n))
    constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1.0}]

    def objective(w):
        return np.dot(w.T, np.dot(cov, w))

    result = minimize(objective, initial_guess, method="SLSQP", bounds=bounds, constraints=constraints)
    return result.x


def compute_efficient_frontier(n_points: int = 15) -> list[dict[str, float]]:
    """
    Computes n_points along the efficient frontier, from the minimum-
    variance portfolio's return up to the highest-returning single asset.
    Each point is the MINIMUM achievable volatility for that return level
    — this is what makes it "efficient" (no portfolio exists that gives
    the same return with less risk).
    """
    returns = np.array([EXPECTED_RETURNS_PCT[a] for a in ASSET_CLASSES])
    cov = _build_covariance_matrix()

    min_var_weights = _get_min_variance_portfolio(returns, cov)
    min_var_return, _ = _portfolio_performance(min_var_weights, returns, cov)
    max_return = float(np.max(returns))

    target_returns = np.linspace(min_var_return, max_return, n_points)
    frontier_points = []

    for target in target_returns:
        weights = _minimize_volatility_for_target_return(float(target), returns, cov)
        if weights is not None:
            port_return, port_volatility = _portfolio_performance(weights, returns, cov)
            frontier_points.append({
                "expected_return_pct": round(port_return, 3),
                "volatility_pct": round(port_volatility, 3),
            })

    return frontier_points


def _map_risk_score_to_target_return(risk_score: int, returns: np.ndarray, cov: np.ndarray) -> float:
    """
    Linearly maps a 1-10 Risk_Appetite_Score onto a target return between
    the minimum-variance portfolio's return (score=1, most conservative
    achievable) and the highest-returning single asset (score=10, most
    aggressive). This is the deterministic bridge between the user's
    self-reported risk tolerance and a specific point on the frontier.
    """
    min_var_weights = _get_min_variance_portfolio(returns, cov)
    min_var_return, _ = _portfolio_performance(min_var_weights, returns, cov)
    max_return = float(np.max(returns))

    risk_score_clamped = max(1, min(10, risk_score))
    fraction = (risk_score_clamped - 1) / 9.0  # 0.0 at score=1, 1.0 at score=10
    target_return = min_var_return + fraction * (max_return - min_var_return)
    return target_return


def recommend_portfolio_allocation(
    risk_appetite_score: int,
    current_allocation: Optional[dict[str, float]] = None,
) -> PortfolioResult:
    """
    Main entry point. Given a user's risk appetite score, returns the
    mathematically optimal portfolio allocation at that risk level, plus
    the full efficient frontier (for charting) and, if the user's current
    allocation is provided, concrete rebalancing actions.

    Args:
        risk_appetite_score: 1 (most conservative) to 10 (most aggressive).
        current_allocation: optional dict like {"Bonds": 0.5, "Equity/Stocks": 0.3,
            "Gold": 0.1, "Mutual Funds": 0.1} — weights should sum to ~1.0.
            If provided, rebalancing_actions will be computed.

    Returns:
        PortfolioResult with recommended_weights, expected performance,
        the efficient frontier, and (optionally) rebalancing actions.
    """
    returns = np.array([EXPECTED_RETURNS_PCT[a] for a in ASSET_CLASSES])
    cov = _build_covariance_matrix()

    target_return = _map_risk_score_to_target_return(risk_appetite_score, returns, cov)
    weights = _minimize_volatility_for_target_return(target_return, returns, cov)

    if weights is None:
        # Fallback: should not normally happen given target_return is derived
        # from the achievable range, but guards against solver edge cases.
        weights = _get_min_variance_portfolio(returns, cov)

    expected_return, expected_volatility = _portfolio_performance(weights, returns, cov)
    sharpe_ratio = (
        (expected_return - RISK_FREE_RATE_PCT) / expected_volatility
        if expected_volatility > 0 else 0.0
    )

    recommended_weights = {
        asset: round(float(w), 4) for asset, w in zip(ASSET_CLASSES, weights)
    }

    rebalancing_actions = None
    if current_allocation is not None:
        rebalancing_actions = []
        for asset in ASSET_CLASSES:
            current_w = float(current_allocation.get(asset, 0.0))
            recommended_w = recommended_weights[asset]
            delta = round(recommended_w - current_w, 4)

            if abs(delta) < 0.02:  # under 2 percentage points -> not worth trading
                action = "hold"
            elif delta > 0:
                action = "increase"
            else:
                action = "decrease"

            rebalancing_actions.append({
                "asset_class": asset,
                "current_weight_pct": round(current_w * 100, 2),
                "recommended_weight_pct": round(recommended_w * 100, 2),
                "change_percentage_points": round(delta * 100, 2),
                "action": action,
            })

    return PortfolioResult(
        risk_appetite_score=risk_appetite_score,
        target_return_pct=round(target_return, 3),
        recommended_weights={k: round(v * 100, 2) for k, v in recommended_weights.items()},
        expected_return_pct=round(expected_return, 3),
        expected_volatility_pct=round(expected_volatility, 3),
        sharpe_ratio=round(sharpe_ratio, 3),
        efficient_frontier=compute_efficient_frontier(),
        rebalancing_actions=rebalancing_actions,
        disclaimer=_DISCLAIMER,
    )