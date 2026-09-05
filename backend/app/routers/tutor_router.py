from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import engine as eng
from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


@router.post("/ask")
def ask(payload: schemas.TutorAskIn, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    states = db.query(models.KnowledgeState).filter(models.KnowledgeState.user_id == current_user.id).all()
    k = eng.knowledge_dict(states)
    response = eng.tutor_respond(payload.message, k)

    db.add(models.ChatMessage(user_id=current_user.id, role="user", text=payload.message))
    db.add(models.ChatMessage(user_id=current_user.id, role="assistant", text=response["text"]))
    db.commit()

    return response


@router.get("/history")
def history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    msgs = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.user_id == current_user.id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    return {"messages": [{"role": m.role, "text": m.text} for m in msgs]}
