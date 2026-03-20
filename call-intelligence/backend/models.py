from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, JSON, String, Text

from database import Base


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(String, nullable=False, default="uploaded")
    transcript = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    agent_talk_time_percent = Column(Float, nullable=True)
    customer_talk_time_percent = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)
    sentiment = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    communication_clarity_score = Column(Float, nullable=True)
    politeness_score = Column(Float, nullable=True)
    business_knowledge_score = Column(Float, nullable=True)
    problem_handling_score = Column(Float, nullable=True)
    listening_ability_score = Column(Float, nullable=True)
    keywords = Column(JSON, nullable=True)
    action_items = Column(JSON, nullable=True)
    positive_observations = Column(JSON, nullable=True)
    negative_observations = Column(JSON, nullable=True)
    questionnaire_coverage = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
