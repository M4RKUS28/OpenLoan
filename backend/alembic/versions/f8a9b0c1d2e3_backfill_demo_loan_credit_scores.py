"""backfill demo loan credit scores

Revision ID: f8a9b0c1d2e3
Revises: e7f8a9b0c1d2
Create Date: 2026-06-07 17:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f8a9b0c1d2e3"
down_revision: str | None = "e7f8a9b0c1d2"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


BORROWER_COMPONENT_DEFINITIONS = (
    ("repayment_history", "Past repayment history on our platform", 20),
    ("current_platform_exposure", "Current exposure on our platform", 10),
    ("business_age_continuity", "Business age and operating continuity", 5),
    ("legal_compliance", "Legal/compliance status", 4),
    ("kyb_consistency", "Basic borrower identity and KYB consistency", 2),
    ("cdi_activity_continuity", "CDI-observed business activity continuity", 4),
)

TRANSACTION_COMPONENT_DEFINITIONS = (
    (
        "loan_to_invoice_reasonableness",
        "Loan-to-invoice / advance-rate reasonableness",
        8,
    ),
    ("collateral_recovery_quality", "Collateral/recovery quality", 10),
    ("platform_order_normality", "Order normality based on our platform history", 7),
    ("basic_transaction_completeness", "Basic transaction completeness", 5),
    ("verified_trade_shipment", "Verified trade/shipment data", 14),
    ("supplier_reliability", "Supplier reliability", 4),
    ("cdi_order_normality", "CDI-based order normality", 4),
    (
        "buyer_channel_concentration",
        "Buyer/customer/channel concentration risk",
        3,
    ),
)

SEED_SCORE_PROFILES = {
    "Import of consumer electronics from Shenzhen": {
        "borrower": (94, 88, 90, 96, 95, 88),
        "transaction": (75, 82, 78, 100, 92, 86, 82, 78),
    },
    "Export order — apparel shipment to Hamburg": {
        "borrower": (76, 62, 75, 88, 84, 70),
        "transaction": (65, 75, 70, 100, 76, 68, 62, 60),
    },
    "Cold-chain seafood import from Japan": {
        "borrower": (82, 78, 80, 90, 86, 76),
        "transaction": (85, 75, 76, 100, 84, 80, 78, 72),
    },
    "Automotive parts restock — PRD aftermarket": {
        "borrower": (88, 70, 86, 92, 90, 82),
        "transaction": (85, 85, 82, 100, 78, 72, 76, 70),
    },
    "K-beauty product line import": {
        "borrower": (48, 45, 52, 72, 65, 50),
        "transaction": (65, 40, 45, 100, 54, 48, 42, 45),
    },
    "Wearables shipment — completed Q2 deal": {
        "borrower": (96, 90, 88, 95, 96, 89),
        "transaction": (85, 82, 88, 100, 94, 88, 90, 84),
    },
    "Premium fabric import — funded": {
        "borrower": (76, 62, 75, 88, 84, 70),
        "transaction": (65, 85, 78, 100, 80, 74, 70, 68),
    },
}


def upgrade() -> None:
    connection = op.get_bind()
    statement = sa.text(
        """
        UPDATE loans
        SET credit_score = :credit_score,
            risk_score = :risk_score,
            risk_grade = :risk_grade
        WHERE title = :title
        """
    ).bindparams(sa.bindparam("credit_score", type_=sa.JSON()))

    for title, profile in SEED_SCORE_PROFILES.items():
        credit_score = _credit_score(
            profile["borrower"],
            profile["transaction"],
        )
        connection.execute(
            statement,
            {
                "title": title,
                "credit_score": credit_score,
                "risk_score": round(float(credit_score["total_score"])),
                "risk_grade": credit_score["grade"],
            },
        )


def downgrade() -> None:
    connection = op.get_bind()
    statement = sa.text(
        """
        UPDATE loans
        SET credit_score = NULL
        WHERE title = :title
        """
    )
    for title in SEED_SCORE_PROFILES:
        connection.execute(statement, {"title": title})


def _credit_score(
    borrower_raw_scores: Sequence[float],
    transaction_raw_scores: Sequence[float],
) -> dict:
    borrower_components = _components(
        BORROWER_COMPONENT_DEFINITIONS,
        borrower_raw_scores,
    )
    transaction_components = _components(
        TRANSACTION_COMPONENT_DEFINITIONS,
        transaction_raw_scores,
    )
    borrower_score = round(
        sum(component["weighted_points"] for component in borrower_components),
        2,
    )
    transaction_score = round(
        sum(component["weighted_points"] for component in transaction_components),
        2,
    )
    total_score = round(borrower_score + transaction_score, 2)

    return {
        "total_score": total_score,
        "grade": _grade_from_score(total_score),
        "borrower_score": borrower_score,
        "transaction_score": transaction_score,
        "showstopper": None,
        "borrower_components": borrower_components,
        "transaction_components": transaction_components,
    }


def _components(
    definitions: Sequence[tuple[str, str, int]],
    raw_scores: Sequence[float],
) -> list[dict]:
    if len(definitions) != len(raw_scores):
        raise ValueError("Migration score profile does not match the score component table")
    return [
        {
            "key": key,
            "label": label,
            "weight_percent": weight,
            "raw_score_0_100": round(float(raw_score), 2),
            "weighted_points": round(float(raw_score) * weight / 100, 2),
        }
        for (key, label, weight), raw_score in zip(definitions, raw_scores, strict=True)
    ]


def _grade_from_score(score: float) -> str:
    if score >= 85:
        return "A"
    if score >= 70:
        return "B"
    if score >= 55:
        return "C"
    if score >= 40:
        return "D"
    return "E"
