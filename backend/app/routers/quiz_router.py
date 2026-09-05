import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from ..questions import QUESTIONS

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/generate")
def generate_quiz(payload: schemas.QuizGenerateIn, current_user: models.User = Depends(get_current_user)):
    topic = payload.topic or "all"
    difficulty = payload.difficulty or "all"

    pool = [
        q for q in QUESTIONS
        if (topic == "all" or q["concept_id"] == topic) and (difficulty == "all" or str(q["diff"]) == str(difficulty))
    ]
    if not pool:
        raise HTTPException(status_code=400, detail="No questions match that filter — widen your selection.")

    count = max(1, min(payload.count, len(pool)))
    picked = random.sample(pool, count)
    return {"questions": picked}


@router.post("/submit")
def submit_quiz(payload: schemas.QuizSubmitIn, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.answers:
        raise HTTPException(status_code=400, detail="No answers submitted")

    by_concept: dict = {}
    for a in payload.answers:
        entry = by_concept.setdefault(a.concept_id, {"total": 0, "correct": 0})
        entry["total"] += 1
        if a.correct:
            entry["correct"] += 1

    results = {}
    for concept_id, agg in by_concept.items():
        state = db.query(models.KnowledgeState).filter(
            models.KnowledgeState.user_id == current_user.id,
            models.KnowledgeState.concept_id == concept_id,
        ).first()
        if not state:
            state = models.KnowledgeState(user_id=current_user.id, concept_id=concept_id, mastery=0, attempts=0)
            db.add(state)

        acc = (agg["correct"] / agg["total"]) * 100
        old = state.mastery or 0
        state.mastery = round(old * 0.5 + acc * 0.5, 1)
        state.last_studied = datetime.utcnow()
        state.attempts = (state.attempts or 0) + 1
        results[concept_id] = {"correct": agg["correct"], "total": agg["total"], "new_mastery": state.mastery}

    total = sum(a["total"] for a in by_concept.values())
    correct_total = sum(a["correct"] for a in by_concept.values())
    current_user.xp = (current_user.xp or 0) + correct_total * 15 + total * 5

    db.add(models.QuizAttempt(user_id=current_user.id, total=total, correct=correct_total))
    db.commit()

    return {
        "accuracy": round((correct_total / total) * 100) if total else 0,
        "correct": correct_total,
        "total": total,
        "by_concept": results,
    }
