from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.repositories.customer import customer_repo
from app.schemas.customer import CustomerCreate

class CustomerService:
    def get_customer(self, db: Session, customer_id: str) -> Customer:
        customer = customer_repo.get(db, id=customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} not found"
            )
        return customer

    def get_customers(self, db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
        return customer_repo.get_multi(db, skip=skip, limit=limit)

    def create_customer(self, db: Session, customer_in: CustomerCreate) -> Customer:
        # Business Rule: Email must be unique
        existing = customer_repo.get_by_email(db, email=customer_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Customer with email '{customer_in.email}' already exists"
            )
            
        customer = Customer(
            name=customer_in.name,
            email=customer_in.email,
            phone=customer_in.phone
        )
        return customer_repo.create(db, obj_in=customer)

    def delete_customer(self, db: Session, customer_id: str) -> Customer:
        customer = self.get_customer(db, customer_id)
        
        # Check if customer has orders
        from app.models.order import Order
        has_orders = db.query(Order).filter(Order.customer_id == customer_id).first()
        if has_orders:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete customer with active order history."
            )
            
        return customer_repo.delete(db, id=customer_id)

customer_service = CustomerService()
