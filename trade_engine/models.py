from django.db import models
from django.conf import settings  # to reference CustomUser safely
 
# -------------------------
# ✅ Stock Model
# -------------------------
class Stock(models.Model):
    symbol = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
 
    def __str__(self):
        return f"{self.symbol} - {self.name}"
 
# -------------------------
# ✅ Portfolio Model
# -------------------------
class Portfolio(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0)
 
    def __str__(self):
        return f"{self.user.username}'s portfolio: {self.stock.symbol} x {self.quantity}"
 
# -------------------------
# ✅ Transaction Model
# -------------------------
class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]
    ORDER_CATEGORIES = [
        ('MARKET', 'Market'),
        ('LIMIT', 'Limit'),
    ]
 
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    sstock = models.ForeignKey(Stock, on_delete=models.CASCADE, null=True)
    transaction_type = models.CharField(max_length=4, choices=TRANSACTION_TYPES)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    limit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    order_category = models.CharField(max_length=6, choices=ORDER_CATEGORIES, default='MARKET')
    timestamp = models.DateTimeField(auto_now_add=True)
 
    def __str__(self):
        return f"{self.transaction_type} - {self.quantity} of {self.sstock.symbol} by {self.user.username}"
 
 
# trade_engine/models.py
class PendingOrder(models.Model):
 
    ORDER_TYPES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]
    ORDER_CATEGORIES = [
        ('MARKET', 'Market'),
        ('LIMIT', 'Limit'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    side = models.CharField(max_length=4, choices=ORDER_TYPES,default='')  # BUY or SELL
    order_type = models.CharField(max_length=6, choices=ORDER_CATEGORIES, default='MARKET')
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price snapshot at time of order
    limit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # For LIMIT only
    created_at = models.DateTimeField(auto_now_add=True)
    executed = models.BooleanField(default=False)
 
    def __str__(self):
        return f"{self.user.username} {self.order_type} {self.side} {self.quantity} {self.stock.symbol} @ {self.price}"

class LimitOrder(models.Model):
    # user = models.ForeignKey(User, on_delete=models.CASCADE)
    # stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    order_type = models.CharField(max_length=4, choices=[('BUY', 'Buy'), ('SELL', 'Sell')], default="BUY")  # ✅ new field
    limit_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_executed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    executed_at = models.DateTimeField(null=True, blank=True)
 
    def __str__(self):
        return f"{self.order_type} {self.quantity} of {self.stock.symbol} at {self.limit_price} by {self.user.username}"