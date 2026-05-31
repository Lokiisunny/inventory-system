import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="completed")  # "completed", "cancelled"
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
