from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.customer import Customer

def seed_data(db: Session):
    # Check if we already have products
    if db.query(Product).count() == 0:
        products = [
            Product(sku="PROD-001", name="Ergonomic Office Chair", price=199.99, quantity=15),
            Product(sku="PROD-002", name="Mechanical Keyboard", price=89.99, quantity=8),
            Product(sku="PROD-003", name="UltraWide Monitor 34\"", price=349.99, quantity=4),
            Product(sku="PROD-004", name="Wireless Noise-Cancelling Headphones", price=129.99, quantity=20),
            Product(sku="PROD-005", name="USB-C Hub Multiport Adapter", price=29.99, quantity=50),
        ]
        for p in products:
            db.add(p)
            
    # Check if we already have customers
    if db.query(Customer).count() == 0:
        customers = [
            Customer(name="John Doe", email="john.doe@example.com", phone="+1-555-0199"),
            Customer(name="Jane Smith", email="jane.smith@example.com", phone="+1-555-0288"),
            Customer(name="Alice Cooper", email="alice.cooper@example.com", phone="+1-555-0377"),
        ]
        for c in customers:
            db.add(c)
            
    db.commit()
