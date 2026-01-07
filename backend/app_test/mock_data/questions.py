QUESTIONS = [
    {
        "title": "Addition",
        "ai_generated": True,
        "isAdaptive": False,
    },
    {
        "title": "Multiplication",
        "ai_generated": True,
        "isAdaptive": False,
    },
]
ADDITIONAL_METADATA = {
    "topics": ["math", "science", "engineering"],
    "languages": ["python"],
    "qtypes": ["numerical", "multiple-choice"],
}

QUESTION_FULL = {**QUESTIONS[0], **ADDITIONAL_METADATA}


QUESTION_GROUPS = [
    {"case": "single_question", "questions": [QUESTIONS[0]]},
    {"case": "multiple_questions", "questions": QUESTIONS},
    {
        "case": "multiple_questions_with_additional_meta",
        "questions": [{**q, **ADDITIONAL_METADATA} for q in QUESTIONS],
    },
]
