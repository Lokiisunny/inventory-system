from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100, description="Unique SKU code")
    name: str = Field(..., min_length=1, max_length=255, description="Product Name")
    price: Decimal = Field(..., ge=0, description="Price must be non-negative")
    quantity: int = Field(..., ge=0, description="Quantity must be non-negative")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[Decimal] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }
