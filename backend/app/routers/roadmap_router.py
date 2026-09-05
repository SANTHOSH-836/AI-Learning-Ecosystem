from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import engine as eng
from .. import models
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


@router.get("")
def get_roadmap(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    states = db.query(models.KnowledgeState).filter(models.KnowledgeState.user_id == current_user.id).all()
    k = eng.knowledge_dict(states)
    months = eng.roadmap_for(current_user.career_goal, k)
    return {"career_goal": current_user.career_goal, "months": months}
