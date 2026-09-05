from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from . import models
from .curriculum import CONCEPTS
from .security import hash_password

DEMO_EMAIL = "demo@edunexus.ai"

# concept_id -> (mastery, days_since_last_studied or None if never studied)
SEED_MASTERY = {
    "syntax_basics": (92, 2), "data_types": (88, 3), "operators": (85, 5), "control_flow": (79, 4),
    "strings": (74, 6), "lists_tuples": (81, 3), "dicts_sets": (63, 25), "functions": (70, 7),
    "comprehensions": (45, 10), "exceptions": (38, 12), "modules_packages": (55, 20), "oop_basics": (42, 9),
    "file_handling": (20, 15), "iterators_generators": (15, 16), "oop_advanced": (10, 18),
    "data_structures_py": (25, 14), "testing_py": (30, 11), "libraries_ecosystem": (48, 18),
    "decorators": (0, None), "algorithms_py": (18, 19),
}


def create_blank_knowledge(db: Session, user: models.User) -> None:
    for c in CONCEPTS:
        db.add(models.KnowledgeState(user_id=user.id, concept_id=c["id"], mastery=0, last_studied=None, attempts=0))
    db.commit()


def seed_demo_user(db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.email == DEMO_EMAIL).first()
    if user:
        return user

    user = models.User(
        email=DEMO_EMAIL,
        hashed_password=hash_password("demo-account-not-a-real-login"),
        student_name="Demo Student",
        is_demo=True,
        streak=12,
        xp=1840,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    for c in CONCEPTS:
        mastery, days = SEED_MASTERY.get(c["id"], (0, None))
        last_studied = datetime.utcnow() - timedelta(days=days) if days is not None else None
        db.add(models.KnowledgeState(
            user_id=user.id, concept_id=c["id"], mastery=mastery,
            last_studied=last_studied, attempts=2 if days is not None else 0,
        ))
    db.commit()
    return user
