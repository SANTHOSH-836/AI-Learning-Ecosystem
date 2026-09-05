from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import engine as eng
from .. import models
from ..auth import get_current_user
from ..curriculum import CONCEPTS
from ..database import get_db

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("")
def get_graph(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    states = db.query(models.KnowledgeState).filter(models.KnowledgeState.user_id == current_user.id).all()
    k = eng.knowledge_dict(states)

    concepts = []
    for c in CONCEPTS:
        ks = k.get(c["id"], {})
        concepts.append({**c, "mastery": ks.get("mastery", 0), "last_studied": ks.get("last_studied"), "attempts": ks.get("attempts", 0)})

    return {"concepts": concepts, "career_goal": current_user.career_goal}
