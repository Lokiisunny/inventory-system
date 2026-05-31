import uuid
from sqlalchemy import Column, String, DateTime, func
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
