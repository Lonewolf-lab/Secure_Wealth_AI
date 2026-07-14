"""
Secure Wealth Twin — Market Trend Forecaster Training Script
================================================================
Trains THREE separate Prophet time-series models — one each for Stocks,
Gold, and Inflation. Per the architecture blueprint (Section B), this is
a TIME-SERIES problem, not a classification/regression-on-tabular-data
problem: Prophet handles trend + seasonality decomposition with minimal
tuning, which matters for a hackathon timeline.

Each series gets its own independent model (not one multi-output model)
since Stocks, Gold, and Inflation have genuinely different dynamics
(different trend strength, different seasonality, different noise
characteristics) — forcing them into one model would blur all three.

Expected execution location: src/ml_engines/train_market_forecaster.py
Reads from:  ../../data/market_trends_data.csv
Writes to:   ../../models/market_forecast_models.joblib
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import pandas as pd
from prophet import Prophet

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent

DATA_PATH = PROJECT_ROOT / "data" / "market_trends_data.csv"
MODELS_DIR = PROJECT_ROOT / "models"
OUTPUT_PATH = MODELS_DIR / "market_forecast_models.joblib"

# Maps our dataset's column names to a clean series identifier used
# throughout the forecasting endpoint.
SERIES_COLUMNS = {
    "stocks": "stocks_index",
    "gold": "gold_price_inr_per_10g",
    "inflation": "inflation_yoy_pct",
}

FORECAST_HORIZON_DAYS = 90  # used only for the sanity-check plot data below,
                             # the actual endpoint lets the caller choose


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"Could not find dataset at: {path}\nRun generate_synthetic_market_data.py first."
        )
    df = pd.read_csv(path, parse_dates=["date"])
    print(f"✅ Loaded dataset: {df.shape[0]} rows from {path}")
    return df


def train_single_series(df: pd.DataFrame, value_column: str, series_name: str) -> Prophet:
    """
    Fits one Prophet model on a single time series. Prophet requires
    exactly two columns: 'ds' (date) and 'y' (value).
    """
    series_df = df[["date", value_column]].rename(columns={"date": "ds", value_column: "y"}).dropna()

    # Stocks data has NaN/flat weekends already forward-filled in the
    # generator, so all series here are already daily-complete — no
    # special weekly-seasonality exclusion needed.
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,  # moderate flexibility in trend changes
        interval_width=0.80,  # 80% confidence interval on forecasts
    )

    print(f"\n🚀 Training Prophet model for '{series_name}' ({len(series_df)} data points)...")
    model.fit(series_df)
    print(f"✅ '{series_name}' model trained.")

    return model


def main() -> None:
    print("=" * 70)
    print("Secure Wealth Twin — Market Trend Forecaster Training")
    print("=" * 70)

    df = load_dataset(DATA_PATH)

    trained_models: dict[str, Prophet] = {}

    for series_name, column in SERIES_COLUMNS.items():
        if column not in df.columns:
            raise ValueError(f"Expected column '{column}' not found in dataset.")
        model = train_single_series(df, column, series_name)
        trained_models[series_name] = model

        # Quick sanity-check forecast, printed to console only (not saved)
        future = model.make_future_dataframe(periods=FORECAST_HORIZON_DAYS)
        forecast = model.predict(future)
        last_actual = df[column].iloc[-1]
        forecast_90d = forecast["yhat"].iloc[-1]
        print(f"   Last actual value: {last_actual:.2f} | "
              f"{FORECAST_HORIZON_DAYS}-day forecast: {forecast_90d:.2f}")

    # -----------------------------------------------------------------
    # EXPORT — all three fitted Prophet models bundled into one file.
    # Prophet models ARE joblib-picklable (they store their fitted Stan
    # backend state), which keeps this consistent with the rest of the
    # project's save/load pattern.
    # -----------------------------------------------------------------
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    bundle = {
        "models": trained_models,
        "series_columns": SERIES_COLUMNS,
    }
    joblib.dump(bundle, OUTPUT_PATH)
    print(f"\n💾 All 3 models saved to: {OUTPUT_PATH}")
    print("\n✅ Done. Artifacts ready for the market forecast endpoint.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\n❌ Training failed: {exc}", file=sys.stderr)
        sys.exit(1)