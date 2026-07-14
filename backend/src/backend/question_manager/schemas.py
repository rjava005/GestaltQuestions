from dataclasses import dataclass


@dataclass
class AccessDecision:
    allowed: bool
    reason: str
