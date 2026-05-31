import uuid
from sqlalchemy import Column, String, Numeric, Integer, DateTime, CheckConstraint, func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint('quantity >= 0', name='check_quantity_non_negative'),
        CheckConstraint('price >= 0', name='check_price_non_negative'),
    )
