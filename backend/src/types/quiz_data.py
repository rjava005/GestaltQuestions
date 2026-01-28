from pydantic import BaseModel
from typing import Optional, List, Any, Dict


class QuizData(BaseModel):
    params: Dict[str, Any]
    correct_answers: Dict[str, Any]
    intermediate: Optional[Dict[str, Any]] = None
    test_results: Optional[Dict[str, Any]] = None
    logs: List[Any] = []
    nDigits: Optional[int] = 3
    sigfigs: Optional[int] = 3
    model_config = {"extra": "allow"}  # Ignore unexpected fields and missing ones
