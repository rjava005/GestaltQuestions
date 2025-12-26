import itertools
from .users import USER_GROUPS
from .questions import QUESTIONS

ATTEMPTS = [
    {"quiz_data": {"a": 1}, "submissions": [{"a": 0}, {"a": 20}]},
    {"quiz_data": {"a": 1}, "submissions": [{"a": 1}, {"a": 2, "b": 1}, {}]},
    {"quiz_data": {"a": 1, "b": 2}, "submissions": [{"a": 1}, {"a": 2, "b": 1}, {}]},
]

MATRIX = list(itertools.product(USER_GROUPS, QUESTIONS, ATTEMPTS))


if __name__ == "__main__":
    print(MATRIX)
