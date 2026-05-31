from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.order import OrderCreate, OrderResponse
from app.services.order import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    return order_service.create_order(db, order_in)

@router.get("", response_model=List[OrderResponse])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return order_service.get_orders(db, skip=skip, limit=limit)

@router.get("/{order_id}", response_model=OrderResponse)
def read_order(order_id: str, db: Session = Depends(get_db)):
    return order_service.get_order(db, order_id)

@router.delete("/{order_id}", response_model=OrderResponse)
def delete_order(order_id: str, db: Session = Depends(get_db)):
    return order_service.delete_order(db, order_id)
