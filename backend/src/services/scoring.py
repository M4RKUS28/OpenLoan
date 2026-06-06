"""Placeholder OpenLoan Score.

This is intentionally a *demonstration* model — the real scoring engine (which
would draw on CDI banking/accounting data, CargoX trade documents, repayment
history and external signals) is out of scope for the MVP. The numbers here are
deterministic functions of the deal inputs so the UI is stable and explainable,
but they should not be read as a genuine credit assessment.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class ScoreFactor:
    key: str
    label: str
    description: str
    score: int  # 0-100
    weight: float  # 0-1, sums to ~1 across factors


@dataclass
class ScoreResult:
    score: int  # 0-100
    grade: str  # A-E
    factors: list[ScoreFactor]


# How each factor is weighted into the headline score.
_FACTOR_META = [
    ("trade_history", "Trade history", "Volume and consistency of past shipments and deals.", 0.25),
    ("financials", "Financial strength", "Revenue, margins and balance-sheet signals via CDI.", 0.25),
    ("repayment", "Repayment record", "Track record of repaying prior financing on time.", 0.20),
    ("counterparty", "Counterparty risk", "Quality of suppliers and buyers in the trade.", 0.15),
    ("documents", "Document verification", "Completeness of trade docs and CargoX e-B/L match.", 0.15),
]


def _grade_for(score: int) -> str:
    if score >= 85:
        return "A"
    if score >= 72:
        return "B"
    if score >= 60:
        return "C"
    if score >= 48:
        return "D"
    return "E"


def _clamp(value: float, low: int = 30, high: int = 96) -> int:
    return max(low, min(high, int(round(value))))


def compute_score(
    *,
    company_name: str,
    title: str,
    amount: Decimal | float,
    term_days: int,
    interest_rate: float,
    industry: str = "",
    documents: int = 0,
) -> ScoreResult:
    """Derive a stable pseudo-score from the deal inputs.

    Larger amounts, longer terms and higher asked rates nudge the score down;
    supplied documents nudge it up. A deterministic seed from the company/title
    adds spread so deals don't all look identical.
    """
    amount_f = float(amount)

    # Deterministic 0..1 jitter from the text inputs (no randomness at request time).
    seed = sum(ord(c) for c in f"{company_name}|{title}|{industry}") % 100
    jitter = seed / 100.0  # 0..0.99

    base = 78.0
    base -= min(amount_f / 1_000_000.0, 1.0) * 14.0      # up to -14 for >= 1M
    base -= max(term_days - 60, 0) / 30.0 * 2.5          # longer terms cost a little
    base -= max(interest_rate - 6.0, 0.0) * 1.3          # higher ask => more risk
    base += min(documents, 4) * 1.6                       # evidence helps
    base += (jitter - 0.5) * 12.0                         # spread

    headline = _clamp(base)

    # Spread the headline across factors with small deterministic offsets.
    offsets = {
        "trade_history": (seed % 9) - 4,
        "financials": (seed % 7) - 3,
        "repayment": (seed % 11) - 5,
        "counterparty": (seed % 5) - 2,
        "documents": min(documents, 4) * 4 - 6,
    }
    factors = [
        ScoreFactor(
            key=key,
            label=label,
            description=desc,
            score=_clamp(headline + offsets.get(key, 0), low=25, high=98),
            weight=weight,
        )
        for key, label, desc, weight in _FACTOR_META
    ]

    return ScoreResult(score=headline, grade=_grade_for(headline), factors=factors)
