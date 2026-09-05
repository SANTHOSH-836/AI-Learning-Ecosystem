from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, SessionLocal, engine
from .routers import auth_router, career_router, dashboard_router, graph_router, quiz_router, roadmap_router, tutor_router
from .seed import seed_demo_user

app = FastAPI(title="EduNexus AI — Python Track", version="1.0.0")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_user(db)
    finally:
        db.close()


app.include_router(auth_router.router)
app.include_router(dashboard_router.router)
app.include_router(graph_router.router)
app.include_router(quiz_router.router)
app.include_router(career_router.router)
app.include_router(roadmap_router.router)
app.include_router(tutor_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "EduNexus AI — Python Track API", "docs": "/docs"}
