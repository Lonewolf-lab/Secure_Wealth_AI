"""
Secure Wealth Twin — API Request/Response Schemas
====================================================
Pydantic models that validate data crossing the frontend <-> backend
boundary. `InvestmentRequest` mirrors the exact feature set the trained
preprocessing pipeline (preprocessors.joblib) expects — field names here
MUST match the `feature_columns` used in train_wealth_model.py exactly,
since they are used to build the inference DataFrame downstream.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class InvestmentRequest(BaseModel):
    """
    Incoming payload for POST /api/predict.

    Field constraints intentionally mirror the realistic bounds used
    during synthetic data generation (Age 18-75, Horizon 6-120 months,
    etc.) — this stops obviously malformed requests (e.g. Age=200) from
    ever reaching the model, and is your FIRST line of defense in the
    "Precision Strategy" guardrail chain from the architecture blueprint.
    """

    Age: int = Field(
        ..., ge=18, le=100, description="User's age in years", examples=[29]
    )
    Annual_Income_INR: float = Field(
        ..., gt=0, description="Gross annual income in INR", examples=[1800000]
    )
    Current_Savings_INR: float = Field(
        ..., ge=0, description="Total current savings/corpus in INR", examples=[900000]
    )
    Monthly_Disposable_Income_INR: float = Field(
        ..., ge=0, description="Monthly income left after expenses, in INR", examples=[65000]
    )
    Tax_Bracket: Literal["0%", "5%", "20%", "30%"] = Field(
        ..., description="User's income tax slab", examples=["20%"]
    )
    Financial_Goal: Literal[
        "Tax Saving", "Wealth Creation", "Retirement", "Short-term Gain"
    ] = Field(..., description="User's stated primary financial goal", examples=["Wealth Creation"])
    Risk_Appetite_Score: int = Field(
        ..., ge=1, le=10, description="Self-assessed risk appetite, 1 (low) - 10 (high)", examples=[8]
    )
    Investment_Horizon_Months: int = Field(
        ..., ge=6, le=120, description="Intended investment horizon in months", examples=[96]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "Age": 29,
                    "Annual_Income_INR": 1800000,
                    "Current_Savings_INR": 900000,
                    "Monthly_Disposable_Income_INR": 65000,
                    "Tax_Bracket": "20%",
                    "Financial_Goal": "Wealth Creation",
                    "Risk_Appetite_Score": 8,
                    "Investment_Horizon_Months": 96,
                }
            ]
        }
    }


class InvestmentResponse(BaseModel):
    """Outgoing payload for POST /api/predict."""

    recommended_asset_class: str = Field(
        ..., description="Predicted asset class label", examples=["Mutual Funds"]
    )
    confidence: float = Field(
        ..., ge=0, le=1, description="Model's confidence in the top prediction", examples=[0.81]
    )
    class_probabilities: dict[str, float] = Field(
        ..., description="Full probability distribution across all asset classes"
    )


class TaxSavingRequest(BaseModel):
    """Incoming payload for POST /api/tax-saving."""

    Annual_Income_INR: float = Field(..., gt=0, examples=[1800000])
    Age: int = Field(..., ge=18, le=100, examples=[29])
    Tax_Regime: Literal["Old", "New"] = Field(..., examples=["Old"])
    Risk_Appetite_Score: int = Field(
        5, ge=1, le=10, description="Reused to decide ELSS vs PPF/NSC within 80C", examples=[8]
    )
    Existing_80C_Investment_INR: float = Field(0, ge=0, examples=[50000])
    Existing_80D_Insurance_INR: float = Field(0, ge=0, examples=[10000])
    Has_Home_Loan: bool = Field(False, examples=[True])
    Home_Loan_Interest_Paid_INR: float = Field(0, ge=0, examples=[50000])


class PortfolioRebalanceRequest(BaseModel):
    """
    Incoming payload for POST /api/rebalance-portfolio.

    current_allocation is OPTIONAL — if omitted, the endpoint just returns
    the mathematically optimal allocation for the given risk score. If
    provided, it also returns concrete rebalancing actions (buy/sell
    deltas) to move the user from their current allocation onto the
    efficient frontier.
    """

    Risk_Appetite_Score: int = Field(
        ..., ge=1, le=10, description="Self-assessed risk appetite, 1 (low) - 10 (high)", examples=[7]
    )
    current_allocation: Optional[dict[str, float]] = Field(
        default=None,
        description="Optional current portfolio weights, e.g. "
                    '{"Bonds": 0.5, "Equity/Stocks": 0.5, "Gold": 0.0, "Mutual Funds": 0.0}. '
                    "Weights should sum to approximately 1.0.",
        examples=[{"Bonds": 0.5, "Equity/Stocks": 0.5, "Gold": 0.0, "Mutual Funds": 0.0}],
    )


class TransactionRequest(BaseModel):
    """
    Incoming payload for POST /api/detect-fraud.

    Field names mirror the feature_columns the Isolation Forest fraud
    detector was trained on — see train_fraud_detector.py.
    """

    Transaction_Amount_INR: float = Field(..., gt=0, examples=[2500.0])
    Transaction_Type: Literal["UPI", "NEFT", "Card Payment", "ATM Withdrawal", "Wire Transfer"] = Field(
        ..., examples=["UPI"]
    )
    Merchant_Category: Literal[
        "Grocery", "Electronics", "Travel", "Utility Bills",
        "Entertainment", "Jewelry", "Cash Withdrawal", "Others",
    ] = Field(..., examples=["Grocery"])
    Hour_of_Day: int = Field(..., ge=0, le=23, examples=[14])
    Day_of_Week: int = Field(..., ge=0, le=6, description="0=Monday ... 6=Sunday", examples=[2])
    Is_New_Device: int = Field(..., ge=0, le=1, examples=[0])
    Is_New_Location: int = Field(..., ge=0, le=1, examples=[0])
    Distance_From_Home_KM: float = Field(..., ge=0, examples=[5.2])
    Account_Age_Days: int = Field(..., ge=0, examples=[730])
    Time_Since_Last_Transaction_Minutes: float = Field(..., ge=0, examples=[95.0])


class FraudDetectionResponse(BaseModel):
    is_anomaly: bool = Field(..., description="True if the transaction is flagged as suspicious")
    risk_score: float = Field(..., ge=0, le=100, description="0 (safe) to 100 (highly suspicious)")
    risk_level: str = Field(..., description="'Low', 'Medium', or 'High'")
    raw_anomaly_score: float = Field(..., description="Raw Isolation Forest decision_function output")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    conversationHistory: Optional[list[ChatMessage]] = None


class ChatResponse(BaseModel):
    response: str