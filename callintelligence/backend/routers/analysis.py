import logging
import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from database import DATA_ROOT, SessionLocal, get_db
from models import Call
from schemas import CallResponse
from services.ai_analysis import analyze_call
from services.transcription import transcribe_audio

router = APIRouter(prefix="/api/analyze", tags=["analysis"])
logger = logging.getLogger(__name__)


def run_analysis_pipeline(call_id: int):
    db = SessionLocal()
    try:
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            return
        abs_path = (
            call.file_path
            if os.path.isabs(call.file_path)
            else os.path.join(DATA_ROOT, call.file_path)
        )
        try:
            t_result = transcribe_audio(abs_path)
        except Exception as exc:
            logger.exception("Transcription failed for call_id=%s", call_id)
            call.status = "error"
            call.summary = f"Transcription failed: {str(exc) or 'Unknown error'}"
            db.commit()
            return
        call.transcript = t_result.get("transcript")
        call.duration_seconds = t_result.get("duration")
        call.status = "analyzing"
        db.commit()
        try:
            analysis = analyze_call(call.transcript or "")
        except Exception as exc:
            logger.exception("Analysis failed for call_id=%s", call_id)
            call.status = "error"
            call.summary = f"Analysis failed: {str(exc) or 'Unknown error'}"
            db.commit()
            return
        call.overall_score = analysis.get("overall_score")
        call.sentiment = analysis.get("sentiment")
        call.summary = analysis.get("summary")
        call.agent_talk_time_percent = analysis.get("agent_talk_time_percent")
        call.customer_talk_time_percent = analysis.get("customer_talk_time_percent")
        call.communication_clarity_score = analysis.get("communication_clarity_score")
        call.politeness_score = analysis.get("politeness_score")
        call.business_knowledge_score = analysis.get("business_knowledge_score")
        call.problem_handling_score = analysis.get("problem_handling_score")
        call.listening_ability_score = analysis.get("listening_ability_score")
        call.keywords = analysis.get("keywords")
        call.action_items = analysis.get("action_items")
        call.positive_observations = analysis.get("positive_observations")
        call.negative_observations = analysis.get("negative_observations")
        call.questionnaire_coverage = analysis.get("questionnaire_coverage")
        call.status = "complete"
        db.commit()
    except Exception as exc:
        try:
            call = db.query(Call).filter(Call.id == call_id).first()
            if call:
                call.status = "error"
                call.summary = f"Processing failed: {str(exc) or 'Unknown error'}"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


@router.post("/{call_id}", response_model=CallResponse)
def trigger_analyze(
    call_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    if call.status in ("transcribing", "analyzing"):
        raise HTTPException(status_code=409, detail="Analysis already in progress")
    call.status = "transcribing"
    db.commit()
    db.refresh(call)
    background_tasks.add_task(run_analysis_pipeline, call_id)
    return call
