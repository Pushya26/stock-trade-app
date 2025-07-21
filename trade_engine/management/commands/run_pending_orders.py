from django.core.management.base import BaseCommand
from trade_engine.execute_orders import execute_pending_orders
from trade.models import PendingOrder
from .utils import is_market_open
 
class Command(BaseCommand):
    help = 'Executes all pending buy/sell orders if market is open'
 
    def handle(self, *args, **kwargs):
        execute_pending_orders()
        self.stdout.write("✅ Pending orders executed (if market open)")