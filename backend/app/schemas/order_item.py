from decimal import Decimal
from pydantic import BaseModel, Field
from app.schemas.product import ProductResponse

class OrderItemBase(BaseModel):
    product_id: str = Field(..., description="Product UUID")
    quantity: int = Field(..., ge=1, description="Quantity ordered (must be at least 1)")

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: str
    price_at_order: Decimal
    product: ProductResponse

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }
