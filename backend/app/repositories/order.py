from sqlalchemy.orm import Session
from app.models.order import Order
from app.repositories.base import BaseRepository

class OrderRepository(BaseRepository[Order]):
    def __init__(self):
        super().__init__(Order)

order_repo = OrderRepository()
