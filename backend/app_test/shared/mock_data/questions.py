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

MECH_QUESTIONS = [
    {
        "title": "Bernoulli Equation",
        "ai_generated": True,
        "isAdaptive": True,
        "topics": ["Fluid Dynamics", "Flow Analysis"],
        "languages": ["javascript"],
        "qtypes": ["multiple-choice"],
    },
    {
        "title": "Thermodynamics First Law",
        "ai_generated": False,
        "isAdaptive": False,
        "topics": ["Thermodynamics", "Energy Balance"],
        "languages": ["python", "javascript"],
        "qtype": ["conceptual"],
    },
    {
        "title": "Statics Basics",
        "ai_generated": True,
        "isAdaptive": True,
        "createdBy": "tester_mech",
        "user_id": 1,
        "topics": ["Mechanics", "Statics"],
        "languages": ["python"],
        "qtype": ["numeric"],
    },
]

ADDITIONAL_METADATA = {
    "topics": ["math", "science", "engineering"],
    "languages": ["python"],
    "qtypes": ["numerical", "multiple-choice"],
}

QUESTION_FULL = {**QUESTIONS[0], **ADDITIONAL_METADATA}

QUESTIONS_FULL = [{**q, **ADDITIONAL_METADATA} for q in QUESTIONS] + MECH_QUESTIONS

QUESTION_GROUPS = [
    {"case": "single_question", "questions": [QUESTIONS[0]]},
    {"case": "multiple_questions", "questions": QUESTIONS},
    {
        "case": "multiple_questions_with_additional_meta",
        "questions": [{**q, **ADDITIONAL_METADATA} for q in QUESTIONS],
    },
]

QUESTION_KEYS = {
    "title",
    "ai_generated",
    "isAdaptive",
}
METAKEYS = {"topics", "languages", "qtypes"}

QUESTION_FIELDS = {*QUESTION_KEYS, *METAKEYS}
