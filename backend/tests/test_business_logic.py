import pytest
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.customer import CustomerCreate
from app.schemas.order import OrderCreate, OrderItemCreate
from app.services.product import product_service
from app.services.customer import customer_service
from app.services.order import order_service

# Setup test SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db_session")
def fixture_db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_create_product_sku_uniqueness(db_session):
    # Create product 1
    p1 = ProductCreate(sku="SKU-001", name="Product 1", price=Decimal("10.00"), quantity=5)
    product_service.create_product(db_session, p1)
    
    # Try to create product 2 with same SKU
    p2 = ProductCreate(sku="SKU-001", name="Product 2", price=Decimal("15.00"), quantity=10)
    with pytest.raises(HTTPException) as exc_info:
        product_service.create_product(db_session, p2)
    
    assert exc_info.value.status_code == 409
    assert "already exists" in exc_info.value.detail

def test_create_customer_email_uniqueness(db_session):
    # Create customer 1
    c1 = CustomerCreate(name="John Doe", email="john@example.com", phone="123456")
    customer_service.create_customer(db_session, c1)
    
    # Try to create customer 2 with same email
    c2 = CustomerCreate(name="Jane Doe", email="john@example.com", phone="789012")
    with pytest.raises(HTTPException) as exc_info:
        customer_service.create_customer(db_session, c2)
        
    assert exc_info.value.status_code == 409
    assert "already exists" in exc_info.value.detail

def test_order_stock_reduction_and_price_calculation(db_session):
    # Setup Product and Customer
    prod = product_service.create_product(db_session, ProductCreate(sku="SKU-001", name="Product 1", price=Decimal("10.50"), quantity=20))
    cust = customer_service.create_customer(db_session, CustomerCreate(name="John Doe", email="john@example.com", phone="123456"))
    
    # Create Order
    order_in = OrderCreate(
        customer_id=cust.id,
        items=[
            OrderItemCreate(product_id=prod.id, quantity=3)
        ]
    )
    order = order_service.create_order(db_session, order_in)
    
    # Verify Stock Deduction (20 - 3 = 17)
    db_session.refresh(prod)
    assert prod.quantity == 17
    
    # Verify Auto-calculated Total Amount (10.50 * 3 = 31.50)
    assert order.total_amount == Decimal("31.50")
    assert order.status == "completed"

def test_order_insufficient_stock_rollback(db_session):
    # Setup Product and Customer
    prod = product_service.create_product(db_session, ProductCreate(sku="SKU-001", name="Product 1", price=Decimal("10.00"), quantity=5))
    cust = customer_service.create_customer(db_session, CustomerCreate(name="John Doe", email="john@example.com", phone="123456"))
    
    # Create Order requesting 10 items (only 5 in stock)
    order_in = OrderCreate(
        customer_id=cust.id,
        items=[
            OrderItemCreate(product_id=prod.id, quantity=10)
        ]
    )
    
    with pytest.raises(HTTPException) as exc_info:
        order_service.create_order(db_session, order_in)
        
    assert exc_info.value.status_code == 400
    assert "Insufficient stock" in exc_info.value.detail
    
    # Verify stock remains unchanged due to rollback
    db_session.refresh(prod)
    assert prod.quantity == 5
    
    # Verify no order was written
    orders_count = db_session.query(Order).count()
    assert orders_count == 0

def test_order_cancellation_restores_stock(db_session):
    # Setup Product and Customer
    prod = product_service.create_product(db_session, ProductCreate(sku="SKU-001", name="Product 1", price=Decimal("10.00"), quantity=10))
    cust = customer_service.create_customer(db_session, CustomerCreate(name="John Doe", email="john@example.com", phone="123456"))
    
    # Place Order of 4 items (10 -> 6)
    order_in = OrderCreate(
        customer_id=cust.id,
        items=[
            OrderItemCreate(product_id=prod.id, quantity=4)
        ]
    )
    order = order_service.create_order(db_session, order_in)
    
    db_session.refresh(prod)
    assert prod.quantity == 6
    
    # Cancel/Delete Order
    order_service.delete_order(db_session, order.id)
    
    # Verify stock is restored to 10
    db_session.refresh(prod)
    assert prod.quantity == 10
    
    # Verify order is deleted from db
    orders_count = db_session.query(Order).count()
    assert orders_count == 0
