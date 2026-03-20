from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class CallBase(BaseModel):
    filename: str
    file_path: str
    status: str


class CallResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_path: str
    status: str
    transcript: Optional[str] = None
    duration_seconds: Optional[float] = None
    agent_talk_time_percent: Optional[float] = None
    customer_talk_time_percent: Optional[float] = None
    overall_score: Optional[float] = None
    sentiment: Optional[str] = None
    summary: Optional[str] = None
    communication_clarity_score: Optional[float] = None
    politeness_score: Optional[float] = None
    business_knowledge_score: Optional[float] = None
    problem_handling_score: Optional[float] = None
    listening_ability_score: Optional[float] = None
    keywords: Optional[list] = None
    action_items: Optional[list] = None
    positive_observations: Optional[list] = None
    negative_observations: Optional[list] = None
    questionnaire_coverage: Optional[dict[str, Any]] = None
    created_at: datetime


class UploadResponse(BaseModel):
    id: int
    filename: str
    status: str
