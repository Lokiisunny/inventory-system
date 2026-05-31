from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel, Field
from app.schemas.customer import CustomerResponse
from app.schemas.order_item import OrderItemCreate, OrderItemResponse

class OrderCreate(BaseModel):
    customer_id: str = Field(..., description="Customer ID")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least 1 item")

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    total_amount: Decimal
    status: str
    created_at: datetime
    customer: CustomerResponse
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: int
