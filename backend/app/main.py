from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.seed import seed_data
from app.routers import products, customers, orders, dashboard

# Automatically create database tables
Base.metadata.create_all(bind=engine)

# Seed database
db = SessionLocal()
try:
    seed_data(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Clean Architecture Inventory & Order Management API",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(IntegrityError)
def integrity_error_handler(request: Request, exc: IntegrityError):
    # Parse SQL error to give a clean message
    error_msg = str(exc.orig)
    detail = "Database integrity violation."
    
    if "unique constraint" in error_msg.lower() or "unique" in error_msg.lower():
        if "sku" in error_msg.lower():
            detail = "Product SKU must be unique."
        elif "email" in error_msg.lower():
            detail = "Customer email must be unique."
        else:
            detail = "A unique constraint was violated."
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": detail}
        )
    elif "check_quantity_non_negative" in error_msg.lower() or "quantity" in error_msg.lower():
        detail = "Product quantity cannot be negative."
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": detail}
        )
        
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": f"Database Integrity Error: {detail} ({error_msg})"}
    )

# Include Routers
@app.get("/api/v1")
@app.get("/api/v1/")
def api_v1_root():
    return {"status": "ok", "message": "API v1 is operational"}

app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(customers.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME}",
        "docs": "/docs",
        "version": "1.0.0"
    }
