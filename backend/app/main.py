from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, setup, menu, orders, config

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(setup.router, prefix="/api/v1")
app.include_router(menu.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(config.router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}