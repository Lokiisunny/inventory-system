from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.product import Product
from app.repositories.product import product_repo
from app.schemas.product import ProductCreate, ProductUpdate

class ProductService:
    def get_product(self, db: Session, product_id: str) -> Product:
        product = product_repo.get(db, id=product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )
        return product

    def get_products(self, db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
        return product_repo.get_multi(db, skip=skip, limit=limit)

    def create_product(self, db: Session, product_in: ProductCreate) -> Product:
        # Business Rule: SKU must be unique
        existing = product_repo.get_by_sku(db, sku=product_in.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{product_in.sku}' already exists"
            )
        
        # Quantity validation is already done by Pydantic (quantity >= 0)
        product = Product(
            sku=product_in.sku,
            name=product_in.name,
            price=product_in.price,
            quantity=product_in.quantity
        )
        return product_repo.create(db, obj_in=product)

    def update_product(self, db: Session, product_id: str, product_in: ProductUpdate) -> Product:
        product = self.get_product(db, product_id)
        
        # Business Rule: SKU must be unique if it's changing
        if product_in.sku and product_in.sku != product.sku:
            existing = product_repo.get_by_sku(db, sku=product_in.sku)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product with SKU '{product_in.sku}' already exists"
                )
        
        return product_repo.update(db, db_obj=product, obj_in=product_in)

    def delete_product(self, db: Session, product_id: str) -> Product:
        # Check if product exists
        product = self.get_product(db, product_id)
        
        # Check if product is in any orders
        # (For relational integrity, we shouldn't allow deleting a product that has been ordered, 
        # or we cascade delete. Let's check. If there are order items for this product, let's prevent deletion to avoid breaking sales history, or soft delete/raise 400).
        # Preventing deletion of products in sales history is a solid business rule.
        from app.models.order_item import OrderItem
        ordered = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
        if ordered:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete product as it is referenced in existing orders. Set inventory to 0 instead."
            )
            
        return product_repo.delete(db, id=product_id)

product_service = ProductService()
