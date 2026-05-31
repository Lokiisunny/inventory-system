from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.order import DashboardStats
from app.services.order import order_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    return order_service.get_dashboard_stats(db)
