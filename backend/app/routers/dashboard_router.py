from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import engine as eng
from .. import models
from ..auth import get_current_user
from ..curriculum import CONCEPTS
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    states = db.query(models.KnowledgeState).filter(models.KnowledgeState.user_id == current_user.id).all()
    k = eng.knowledge_dict(states)

    matches = eng.all_career_matches(k)
    decay = eng.decay_alerts(k)
    recs = eng.recommendations(current_user.student_name, k, current_user.career_goal)
    roadmap = eng.roadmap_for(current_user.career_goal, k) if current_user.career_goal else []

    todays_plan = []
    if roadmap and roadmap[0]["concepts"] and not roadmap[0]["concepts"][0].get("is_project"):
        todays_plan = roadmap[0]["concepts"]
    if not todays_plan:
        started = [
            {**c, "mastery": k.get(c["id"], {}).get("mastery", 0)}
            for c in CONCEPTS
            if 0 < k.get(c["id"], {}).get("mastery", 0) < 60
        ]
        todays_plan = started[:3]

    return {
        "student_name": current_user.student_name,
        "streak": current_user.streak,
        "xp": current_user.xp,
        "knowledge_score": eng.knowledge_score(k),
        "readiness_score": eng.readiness_score(k),
        "top_career_match": matches[0] if matches else None,
        "todays_plan": todays_plan,
        "decay_alerts": decay[:4],
        "recommendations": recs,
        "career_goal": current_user.career_goal,
    }
