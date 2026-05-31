from typing import Optional
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.repositories.base import BaseRepository

class CustomerRepository(BaseRepository[Customer]):
    def __init__(self):
        super().__init__(Customer)

    def get_by_email(self, db: Session, email: str) -> Optional[Customer]:
        return db.query(self.model).filter(self.model.email == email).first()

customer_repo = CustomerRepository()
