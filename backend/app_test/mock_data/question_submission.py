import itertools
from .users import USER_GROUPS
from .questions import QUESTION_GROUPS

ATTEMPTS = [
    {"quiz_data": {"a": 1}, "submissions": [{"a": 0}, {"a": 20}]},
    {"quiz_data": {"a": 1}, "submissions": [{"a": 1}, {"a": 2, "b": 1}, {}]},
    {"quiz_data": {"a": 1, "b": 2}, "submissions": [{"a": 1}, {"a": 2, "b": 1}, {}]},
]


SCENARIOS = [
    {
        "users": users,
        "questions": questions,
        "attempts": attempts,
    }
    for users, questions, attempts in itertools.product(
        USER_GROUPS,
        QUESTION_GROUPS,
        ATTEMPTS,
    )
]

if __name__ == "__main__":
    from pprint import pprint

    pprint(SCENARIOS)
    print(len(SCENARIOS))
