from .types import RiskGrade


def grade_from_score(score: float) -> RiskGrade:
    if score >= 85:
        return "A"
    if score >= 70:
        return "B"
    if score >= 55:
        return "C"
    if score >= 40:
        return "D"
    return "E"
