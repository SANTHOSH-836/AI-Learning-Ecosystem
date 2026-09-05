from typing import List, Optional

from pydantic import BaseModel, EmailStr


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    student_name: str = "Student"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeOut(BaseModel):
    id: int
    email: str
    student_name: str
    career_goal: Optional[str] = None
    streak: int
    xp: int

    class Config:
        from_attributes = True


class QuizGenerateIn(BaseModel):
    topic: Optional[str] = "all"
    difficulty: Optional[str] = "all"
    count: int = 5


class QuizAnswerIn(BaseModel):
    concept_id: str
    correct: bool


class QuizSubmitIn(BaseModel):
    answers: List[QuizAnswerIn]


class CareerGoalIn(BaseModel):
    career_id: str


class TutorAskIn(BaseModel):
    message: str
