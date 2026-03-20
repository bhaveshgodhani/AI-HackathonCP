import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import DATA_ROOT, get_db
from models import Call
from schemas import CallResponse, UploadResponse

router = APIRouter(prefix="/api/calls", tags=["calls"])

UPLOAD_DIR = os.path.join(DATA_ROOT, "uploads")
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg"}


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=UploadResponse)
async def upload_call(file: UploadFile = File(...), db: Session = Depends(get_db)):
    _ensure_upload_dir()
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    stored_name = f"{uuid.uuid4().hex}{ext}"
    rel_path = os.path.join("uploads", stored_name)
    abs_path = os.path.join(DATA_ROOT, rel_path)
    content = await file.read()
    with open(abs_path, "wb") as out:
        out.write(content)
    call = Call(
        filename=file.filename,
        file_path=rel_path,
        status="uploaded",
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return UploadResponse(id=call.id, filename=call.filename, status=call.status)


@router.get("", response_model=List[CallResponse])
def list_calls(db: Session = Depends(get_db)):
    calls = db.query(Call).order_by(Call.created_at.desc()).all()
    return calls


@router.get("/{call_id}", response_model=CallResponse)
def get_call(call_id: int, db: Session = Depends(get_db)):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.delete("/{call_id}", response_model=dict)
def delete_call(call_id: int, db: Session = Depends(get_db)):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    abs_audio = (
        call.file_path
        if os.path.isabs(call.file_path)
        else os.path.join(DATA_ROOT, call.file_path)
    )
    db.delete(call)
    db.commit()
    if os.path.isfile(abs_audio):
        try:
            os.remove(abs_audio)
        except OSError:
            pass
    return {"ok": True, "id": call_id}
