from datetime import date, timedelta

FNV_OFFSET_BASIS = 2_166_136_261
FNV_PRIME = 16_777_619


def deterministic_hash(seed: str) -> int:
    value = FNV_OFFSET_BASIS
    for character in seed:
        value ^= ord(character)
        value = (value * FNV_PRIME) & 0xFFFFFFFF
    return value


def hash_token(seed: str, length: int = 8) -> str:
    return _base36(deterministic_hash(seed)).rjust(length, "0")[:length]


def seeded_int(seed: str, minimum: int, maximum: int) -> int:
    lower = int(minimum)
    upper = int(maximum)
    if upper <= lower:
        return lower
    return lower + deterministic_hash(seed) % (upper - lower + 1)


def round2(value: float) -> float:
    return round(value + 1e-12, 2)


def clamp(value: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, value))


def add_days_iso(date_iso: str, days: int) -> str:
    parsed = date.fromisoformat(date_iso)
    return (parsed + timedelta(days=days)).isoformat()


def days_between_iso(start_iso: str, end_iso: str) -> int:
    return (date.fromisoformat(end_iso) - date.fromisoformat(start_iso)).days


def normalize_token(value: str) -> str:
    return "_".join(value.strip().lower().split())


def has_text(value: object) -> bool:
    return isinstance(value, str) and len(value.strip()) > 0


def positive_number(value: object) -> bool:
    return isinstance(value, int | float) and value > 0


def _base36(value: int) -> str:
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    if value == 0:
        return "0"
    digits = []
    current = value
    while current:
        current, remainder = divmod(current, 36)
        digits.append(alphabet[remainder])
    return "".join(reversed(digits))
