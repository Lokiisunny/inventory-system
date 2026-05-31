from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full Name")
    email: EmailStr = Field(..., description="Valid Email Address")
    phone: str = Field(..., min_length=1, max_length=50, description="Phone number")

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
