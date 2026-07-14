"""
Secure Wealth Twin — Investment/ROI Predictor Training Script
================================================================
Trains an XGBoost multi-class classifier that maps a user's financial
profile to a recommended asset class (Bonds / Mutual Funds /
Equity-Stocks / Gold), for use behind the Guardrail/Compliance layer
in the Wealth Manager pipeline.

Expected execution location: src/ml_engines/train_wealth_model.py
Reads from:  ../../data/user_investment_data.csv
Writes to:   ../../models/investment_model.pkl
             ../../models/preprocessors.joblib

Run:
    cd src/ml_engines
    python train_wealth_model.py
(Also safe to run from any other working directory — paths are
resolved relative to this file's own location, not the shell's cwd.)
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

# ---------------------------------------------------------------------------
# 0. PATH RESOLUTION
#    Resolved relative to THIS FILE's location (not the shell's cwd), so
#    the script behaves identically whether run via `python
#    train_wealth_model.py`, an IDE "Run" button, or a scheduler/cron job
#    from an arbitrary working directory.
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent          # .../src/ml_engines
PROJECT_ROOT = SCRIPT_DIR.parent.parent                # project root

DATA_PATH = PROJECT_ROOT / "data" / "user_investment_data.csv"
MODELS_DIR = PROJECT_ROOT / "models"
MODEL_OUTPUT_PATH = MODELS_DIR / "investment_model.pkl"
PREPROCESSOR_OUTPUT_PATH = MODELS_DIR / "preprocessors.joblib"

RANDOM_STATE = 42
TARGET_COLUMN = "Recommended_Asset_Class"
ID_COLUMN = "User_ID"

# Columns treated as categorical -> One-Hot Encoded
CATEGORICAL_FEATURES = ["Tax_Bracket", "Financial_Goal"]

# Columns treated as numeric -> Standard Scaled
NUMERIC_FEATURES = [
    "Age",
    "Annual_Income_INR",
    "Current_Savings_INR",
    "Monthly_Disposable_Income_INR",
    "Risk_Appetite_Score",
    "Investment_Horizon_Months",
]

# NOTE ON DATA LEAKAGE:
# 'Historical_Portfolio_ROI' is intentionally EXCLUDED from the feature set.
# In the synthetic generator, ROI was derived FROM the asset-class label
# (each class has its own return distribution) — meaning it encodes the
# answer. Training on it would produce deceptively high accuracy in this
# script but would not generalize, since at real inference time (a new
# user with no assigned asset class yet) that value would not exist.
# If you later engineer a leakage-safe version of this signal (e.g. the
# user's OWN portfolio ROI *prior* to any recommendation), it can be
# reintroduced as a legitimate numeric feature.
EXCLUDED_LEAKY_FEATURES = ["Historical_Portfolio_ROI"]


def load_dataset(path: Path) -> pd.DataFrame:
    """Load the synthetic user dataset with a clear, actionable error
    if the expected file is missing."""
    if not path.exists():
        raise FileNotFoundError(
            f"Could not find dataset at: {path}\n"
            f"Expected it at '../../data/user_investment_data.csv' relative to "
            f"'{SCRIPT_DIR}'.\n"
            f"Run generate_synthetic_data.py first, or verify your directory "
            f"structure matches: <project_root>/data/user_investment_data.csv"
        )
    df = pd.read_csv(path)
    print(f"✅ Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns from {path}")
    return df


def build_preprocessor() -> ColumnTransformer:
    """Builds the feature preprocessing pipeline: One-Hot Encoding for
    categoricals, Standard Scaling for numerics. Unknown categories at
    inference time are safely ignored rather than raising an error."""
    return ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",  # explicit: anything not listed above is dropped
    )


def get_onehot_feature_names(preprocessor: ColumnTransformer) -> list[str]:
    """Extracts human-readable feature names after transformation, useful
    for feature-importance inspection and debugging."""
    numeric_names = NUMERIC_FEATURES
    ohe = preprocessor.named_transformers_["categorical"]
    categorical_names = list(ohe.get_feature_names_out(CATEGORICAL_FEATURES))
    return numeric_names + categorical_names


def main() -> None:
    print("=" * 70)
    print("Secure Wealth Twin — Investment/ROI Asset-Class Model Training")
    print("=" * 70)

    # -----------------------------------------------------------------
    # 1. LOAD + CLEAN
    # -----------------------------------------------------------------
    df = load_dataset(DATA_PATH)

    if ID_COLUMN in df.columns:
        df = df.drop(columns=[ID_COLUMN])

    missing_required = [
        c
        for c in NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TARGET_COLUMN]
        if c not in df.columns
    ]
    if missing_required:
        raise ValueError(f"Dataset is missing required columns: {missing_required}")

    if df.isnull().any().any():
        null_counts = df.isnull().sum()
        print("⚠️  Warning: null values detected, dropping affected rows:")
        print(null_counts[null_counts > 0])
        df = df.dropna()

    # -----------------------------------------------------------------
    # 2. FEATURES / TARGET SPLIT
    # -----------------------------------------------------------------
    feature_columns = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    X = df[feature_columns].copy()
    y_raw = df[TARGET_COLUMN].copy()

    dropped_present = [c for c in EXCLUDED_LEAKY_FEATURES if c in df.columns]
    if dropped_present:
        print(f"ℹ️  Excluding leakage-risk column(s) from features: {dropped_present}")

    # -----------------------------------------------------------------
    # 3. TARGET ENCODING
    # -----------------------------------------------------------------
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)

    label_mapping = {
        label: int(code)
        for label, code in zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_))
    }
    print(f"✅ Target label mapping: {label_mapping}")

    # -----------------------------------------------------------------
    # 4. TRAIN / TEST SPLIT
    #    Stratified on y to preserve class proportions in both splits —
    #    important here since asset classes are naturally imbalanced
    #    (e.g. far fewer 'Bonds' users than 'Mutual Funds' users).
    # -----------------------------------------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )
    print(f"✅ Train/Test split: {len(X_train)} train rows / {len(X_test)} test rows")

    # -----------------------------------------------------------------
    # 5. PREPROCESSING
    #    Fit ONLY on training data to prevent test-set leakage into the
    #    scaler's mean/variance or the one-hot encoder's category set.
    # -----------------------------------------------------------------
    preprocessor = build_preprocessor()
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)

    processed_feature_names = get_onehot_feature_names(preprocessor)
    print(f"✅ Preprocessing complete: {X_train_processed.shape[1]} final features")

    # -----------------------------------------------------------------
    # 6. MODEL TRAINING
    # -----------------------------------------------------------------
    model = XGBClassifier(
        objective="multi:softprob",
        num_class=len(label_encoder.classes_),
        max_depth=5,
        learning_rate=0.1,
        n_estimators=100,
        eval_metric="mlogloss",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    print("\n🚀 Training XGBClassifier...")
    model.fit(X_train_processed, y_train)
    print("✅ Training complete.")

    # -----------------------------------------------------------------
    # 7. EVALUATION
    # -----------------------------------------------------------------
    y_pred = model.predict(X_test_processed)
    accuracy = accuracy_score(y_test, y_pred)

    print("\n" + "=" * 70)
    print("EVALUATION RESULTS")
    print("=" * 70)
    print(f"Overall Test Accuracy: {accuracy:.4f}  ({accuracy * 100:.2f}%)")
    print("-" * 70)
    print("Classification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            target_names=label_encoder.classes_,
            digits=4,
            zero_division=0,
        )
    )
    print("=" * 70)

    # Top feature importances — quick sanity/demo artifact
    importances = pd.Series(
        model.feature_importances_, index=processed_feature_names
    ).sort_values(ascending=False)
    print("Top 10 Feature Importances:")
    print(importances.head(10).round(4).to_string())
    print("=" * 70)

    # -----------------------------------------------------------------
    # 8. EXPORT ARTIFACTS
    # -----------------------------------------------------------------
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, MODEL_OUTPUT_PATH)
    print(f"\n💾 Model saved to:         {MODEL_OUTPUT_PATH}")

    # ---------------------------------------------------------------------
    # BUNDLE CONTRACT (must match what src/main.py expects to unpack):
    #   bundle["feature_preprocessor"]  -> fitted ColumnTransformer
    #   bundle["label_encoder"]         -> fitted LabelEncoder
    # This is the fix for the earlier hardcoded-mapping bug: main.py should
    # ALWAYS resolve class names via label_encoder.inverse_transform(...)
    # rather than a manually typed {0: "Bonds", 1: ...} dict, since
    # LabelEncoder assigns codes alphabetically, not in declaration order.
    # ---------------------------------------------------------------------
    artifacts_bundle = {
        "feature_preprocessor": preprocessor,
        "label_encoder": label_encoder,
        # Extra metadata kept for debugging/introspection — not required
        # by main.py, but harmless and useful if you inspect the bundle later.
        "label_mapping": label_mapping,
        "feature_columns": feature_columns,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "processed_feature_names": processed_feature_names,
    }
    joblib.dump(artifacts_bundle, PREPROCESSOR_OUTPUT_PATH)
    print(f"💾 Preprocessors saved to: {PREPROCESSOR_OUTPUT_PATH}")
    print(f"   Bundle keys: {list(artifacts_bundle.keys())}")

    print("\n✅ Done. Artifacts are ready for the inference/serving microservice.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 — top-level guard for a clean CLI failure
        print(f"\n❌ Training failed: {exc}", file=sys.stderr)
        sys.exit(1)