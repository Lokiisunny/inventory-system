from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.services.customer import customer_service

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    return customer_service.create_customer(db, customer_in)

@router.get("", response_model=List[CustomerResponse])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return customer_service.get_customers(db, skip=skip, limit=limit)

@router.get("/{customer_id}", response_model=CustomerResponse)
def read_customer(customer_id: str, db: Session = Depends(get_db)):
    return customer_service.get_customer(db, customer_id)

@router.delete("/{customer_id}", response_model=CustomerResponse)
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    return customer_service.delete_customer(db, customer_id)
