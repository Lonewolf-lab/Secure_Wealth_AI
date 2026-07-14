"""
Secure Wealth Twin — Fraud/Anomaly Detector Training Script
================================================================
Trains an Isolation Forest — UNSUPERVISED anomaly detection — on
transaction data. Per the architecture blueprint (Section B): fraud is a
rare-event detection problem, not a balanced classification problem.
Isolation Forest doesn't need labeled fraud examples to work (real-world
fraud labels are sparse, delayed, and unreliable) — it learns what
"normal" looks like and flags points that are structurally easy to
isolate from the rest of the data.

Is_Fraud IS present in our synthetic dataset, but is used ONLY for
post-hoc evaluation (precision/recall against known ground truth) — it
is explicitly excluded from the feature set the model trains on. This
mirrors how you'd validate a real fraud system: you don't have reliable
labels to train on, but you might have a small sample to evaluate against.

Expected execution location: src/ml_engines/train_fraud_detector.py
Reads from:  ../../data/transactions_data.csv
Writes to:   ../../models/fraud_model.pkl
             ../../models/fraud_preprocessor.joblib
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import OneHotEncoder, StandardScaler

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent

DATA_PATH = PROJECT_ROOT / "data" / "transactions_data.csv"
MODELS_DIR = PROJECT_ROOT / "models"
MODEL_OUTPUT_PATH = MODELS_DIR / "fraud_model.pkl"
PREPROCESSOR_OUTPUT_PATH = MODELS_DIR / "fraud_preprocessor.joblib"

RANDOM_STATE = 42
LABEL_COLUMN = "Is_Fraud"  # evaluation only, never a training feature
ID_COLUMN = "Transaction_ID"

CATEGORICAL_FEATURES = ["Transaction_Type", "Merchant_Category"]
NUMERIC_FEATURES = [
    "Transaction_Amount_INR",
    "Hour_of_Day",
    "Day_of_Week",
    "Is_New_Device",
    "Is_New_Location",
    "Distance_From_Home_KM",
    "Account_Age_Days",
    "Time_Since_Last_Transaction_Minutes",
]

# Contamination = the assumed fraction of the dataset that is anomalous.
# Isolation Forest uses this to set its internal decision threshold. We
# use the SAME rate the synthetic generator injected (2%) — in a real
# deployment this would come from historical fraud-rate estimates, not
# ground truth, since true labels aren't available at training time.
CONTAMINATION = 0.02


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"Could not find dataset at: {path}\n"
            f"Run generate_synthetic_transactions.py first."
        )
    df = pd.read_csv(path)
    print(f"✅ Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns from {path}")
    return df


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
            ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


def main() -> None:
    print("=" * 70)
    print("Secure Wealth Twin — Fraud/Anomaly Detector Training")
    print("=" * 70)

    df = load_dataset(DATA_PATH)

    if ID_COLUMN in df.columns:
        df = df.drop(columns=[ID_COLUMN])

    feature_columns = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    missing = [c for c in feature_columns + [LABEL_COLUMN] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    X = df[feature_columns].copy()
    y_true = df[LABEL_COLUMN].copy()  # EVALUATION ONLY — never passed to .fit()

    print(f"ℹ️  Training UNSUPERVISED — '{LABEL_COLUMN}' excluded from features, "
          f"held out only for post-hoc evaluation.")

    # -----------------------------------------------------------------
    # PREPROCESSING — fit on the FULL feature set. Unlike the supervised
    # XGBoost script, there's no train/test split here in the traditional
    # sense: Isolation Forest doesn't "overfit" to labels since it never
    # sees them. We evaluate on the same data we fit on, which is
    # standard practice for this class of unsupervised anomaly detector.
    # -----------------------------------------------------------------
    preprocessor = build_preprocessor()
    X_processed = preprocessor.fit_transform(X)
    print(f"✅ Preprocessing complete: {X_processed.shape[1]} final features")

    # -----------------------------------------------------------------
    # MODEL TRAINING
    # -----------------------------------------------------------------
    model = IsolationForest(
        n_estimators=200,
        contamination=CONTAMINATION,
        max_samples="auto",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    print("\n🚀 Training IsolationForest...")
    model.fit(X_processed)
    print("✅ Training complete.")

    # -----------------------------------------------------------------
    # EVALUATION — IsolationForest.predict() returns 1 (normal) / -1
    # (anomaly). We convert to 1=fraud/0=normal to match Is_Fraud, then
    # compare against the ground-truth labels we held out.
    # -----------------------------------------------------------------
    raw_predictions = model.predict(X_processed)  # 1 = normal, -1 = anomaly
    y_pred = np.where(raw_predictions == -1, 1, 0)  # 1 = flagged as fraud

    anomaly_scores = model.decision_function(X_processed)  # higher = more normal

    print("\n" + "=" * 70)
    print("EVALUATION RESULTS (against held-out ground truth labels)")
    print("=" * 70)
    print("Confusion Matrix (rows=actual, cols=predicted) [Normal, Fraud]:")
    print(confusion_matrix(y_true, y_pred))
    print("-" * 70)
    print("Classification Report:")
    print(classification_report(y_true, y_pred, target_names=["Normal", "Fraud"], digits=4, zero_division=0))
    print("=" * 70)

    # -----------------------------------------------------------------
    # EXPORT ARTIFACTS
    # -----------------------------------------------------------------
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, MODEL_OUTPUT_PATH)
    print(f"\n💾 Model saved to:         {MODEL_OUTPUT_PATH}")

    preprocessing_bundle = {
        "feature_preprocessor": preprocessor,
        "feature_columns": feature_columns,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "contamination": CONTAMINATION,
    }
    joblib.dump(preprocessing_bundle, PREPROCESSOR_OUTPUT_PATH)
    print(f"💾 Preprocessors saved to: {PREPROCESSOR_OUTPUT_PATH}")

    print("\n✅ Done. Artifacts ready for the fraud detection endpoint.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\n❌ Training failed: {exc}", file=sys.stderr)
        sys.exit(1)