from typing import Optional
from sqlalchemy.orm import Session
from app.models.product import Product
from app.repositories.base import BaseRepository

class ProductRepository(BaseRepository[Product]):
    def __init__(self):
        super().__init__(Product)

    def get_by_sku(self, db: Session, sku: str) -> Optional[Product]:
        return db.query(self.model).filter(self.model.sku == sku).first()

    def update(self, db: Session, *, db_obj: Product, obj_in) -> Product:
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
        db.commit()
        db.refresh(db_obj)
        return db_obj

product_repo = ProductRepository()
