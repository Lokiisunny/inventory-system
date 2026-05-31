from decimal import Decimal
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.repositories.order import order_repo
from app.services.customer import customer_service
from app.schemas.order import OrderCreate, DashboardStats

class OrderService:
    def get_order(self, db: Session, order_id: str) -> Order:
        order = order_repo.get(db, id=order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID {order_id} not found"
            )
        return order

    def get_orders(self, db: Session, skip: int = 0, limit: int = 100) -> List[Order]:
        return order_repo.get_multi(db, skip=skip, limit=limit)

    def create_order(self, db: Session, order_in: OrderCreate) -> Order:
        # Validate Customer Exists
        customer = customer_service.get_customer(db, order_in.customer_id)
        
        order_items = []
        total_amount = Decimal("0.00")
        
        try:
            # We iterate through the order items to check and deduct stock
            for item in order_in.items:
                # Query product. In postgres, with_for_update() locks the row for concurrency
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product with ID {item.product_id} not found"
                    )
                
                # Check sufficient stock
                if product.quantity < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Available: {product.quantity}, Requested: {item.quantity}"
                    )
                
                # Deduct stock
                product.quantity -= item.quantity
                
                # Calculate item amount and accumulate
                item_price = product.price
                total_amount += Decimal(str(item_price)) * item.quantity
                
                # Create OrderItem object
                order_item = OrderItem(
                    product_id=product.id,
                    quantity=item.quantity,
                    price_at_order=item_price
                )
                order_items.append(order_item)
            
            # Create Order
            order = Order(
                customer_id=customer.id,
                total_amount=total_amount,
                status="completed",
                items=order_items
            )
            
            db.add(order)
            db.commit()
            db.refresh(order)
            return order
            
        except Exception as e:
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to place order: {str(e)}"
            )

    def delete_order(self, db: Session, order_id: str) -> Order:
        # Cancel order and restore stock
        order = self.get_order(db, order_id)
        
        try:
            # If the order is already cancelled, we shouldn't restore stock again
            if order.status != "cancelled":
                for item in order.items:
                    product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                    if product:
                        product.quantity += item.quantity
                
                order.status = "cancelled"
                db.commit()
            
            # Actually delete the order from the database
            db.delete(order)
            db.commit()
            return order
            
        except Exception as e:
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to cancel/delete order: {str(e)}"
            )

    def get_dashboard_stats(self, db: Session) -> DashboardStats:
        from app.models.customer import Customer
        
        total_products = db.query(Product).count()
        total_customers = db.query(Customer).count()
        total_orders = db.query(Order).count()
        
        # Low stock condition (quantity < 10)
        low_stock_products = db.query(Product).filter(Product.quantity < 10).count()
        
        return DashboardStats(
            total_products=total_products,
            total_customers=total_customers,
            total_orders=total_orders,
            low_stock_products=low_stock_products
        )

order_service = OrderService()
