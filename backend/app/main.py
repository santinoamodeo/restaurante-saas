from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, setup, menu, orders, config, superadmin

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://trayly.com.ar",
        "https://www.trayly.com.ar",
        "https://admin.trayly.com.ar",
        "https://restaurante-saas-alpha.vercel.app",
        "https://restaurante-saas-admin.vercel.app",
        "https://restaurante-saas-super.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(setup.router, prefix="/api/v1")
app.include_router(menu.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(config.router, prefix="/api/v1")
app.include_router(superadmin.router, prefix="/api/v1/superadmin")

@app.get("/health")
async def health():
    return {"status": "ok"}