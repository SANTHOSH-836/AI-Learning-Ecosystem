from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import engine as eng
from .. import models, schemas
from ..auth import get_current_user
from ..curriculum import CAREER_MAP
from ..database import get_db

router = APIRouter(prefix="/api/career", tags=["career"])


@router.get("/matches")
def get_matches(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    states = db.query(models.KnowledgeState).filter(models.KnowledgeState.user_id == current_user.id).all()
    k = eng.knowledge_dict(states)

    matches = eng.all_career_matches(k)
    out = []
    for m in matches:
        gaps = eng.career_gaps(m["career"]["id"], k)
        out.append({"career": m["career"], "score": m["score"], "gaps": gaps})

    return {"matches": out, "career_goal": current_user.career_goal}


@router.post("/goal")
def set_goal(payload: schemas.CareerGoalIn, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.career_id not in CAREER_MAP:
        raise HTTPException(status_code=400, detail="Unknown career id")
    current_user.career_goal = payload.career_id
    db.commit()
    return {"career_goal": current_user.career_goal}
