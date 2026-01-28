from .models import Numeric


class NumericalEvaluator:
    def exact(self, submitted: Numeric, expected: Numeric) -> bool:
        return submitted == expected

    def absolute(
        self,
        submitted: Numeric,
        expected: Numeric,
        abs_tol: float = 0.1,
    ) -> bool:
        return abs(submitted - expected) <= abs_tol

    def relative(
        self, submitted: Numeric, expected: Numeric, rel_tol: float = 0.1
    ) -> bool:
        return abs(submitted - expected) / abs(expected) <= rel_tol

    def generic(
        self,
        submitted: Numeric,
        expected: Numeric,
        abs_tol: float = 0.1,
        rel_tol: float = 0.1,
    ) -> bool:
        return self.absolute(submitted, expected, abs_tol) or self.relative(
            submitted, expected, rel_tol
        )
