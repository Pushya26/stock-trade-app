from decimal import Decimal
from .models import PendingOrder, Portfolio, Transaction
import yfinance as yf
from django.db import transaction as db_transaction
from celery import shared_task
 
@shared_task
def execute_pending_orders():
    print("Starting to process pending orders...")
 
    pending_orders = PendingOrder.objects.filter(executed=False)
    print(f"Found {pending_orders.count()} pending orders.")
 
    for order in pending_orders:
        print(f"\n Processing Order ID: {order.id} | Type: {order.side} | Stock: {order.stock.symbol} | Qty: {order.quantity}")
 
        try:
            ticker = yf.Ticker(order.stock.symbol)
            current_price = Decimal(ticker.info.get("regularMarketPrice") or 0)
            print(f" Current price for {order.stock.symbol}: {current_price}")
 
            if current_price <= 0:
                print("Invalid market price, skipping this order.")
                continue
 
            user = order.user
            quantity = order.quantity
 
            if order.side == 'BUY':
                print("Order Side: BUY")
 
                if order.order_type == 'LIMIT':
                    print(f"Limit Price: {order.limit_price}")
                    if current_price > Decimal(order.limit_price):
                        print("Current price is above limit price. Skipping.")
                        continue
 
                cost = current_price * quantity
                print(f"Total Cost: {cost}, User Balance: {user.balance}")
 
                if user.balance < cost:
                    print("Insufficient funds. Skipping.")
                    continue
 
                with db_transaction.atomic():
                    print("Executing BUY transaction in DB...")
 
                    user.balance -= cost
                    user.save()
                    print(f"Deducted balance. New balance: {user.balance}")
 
                    portfolio, _ = Portfolio.objects.get_or_create(user=user, stock=order.stock)
                    portfolio.quantity += quantity
                    portfolio.save()
                    print(f"Updated portfolio. Total quantity: {portfolio.quantity}")
 
                    Transaction.objects.create(
                        user=user,
                        sstock=order.stock,
                        transaction_type='BUY',
                        quantity=quantity,
                        price=current_price,
                        order_category=order.order_type
                    )
                    print("Transaction record created.")
 
                    order.executed = True
                    order.save()
                    print("Order marked as executed.")
 
            elif order.side == 'SELL':
                print("Order Side: SELL")
 
                portfolio = Portfolio.objects.filter(user=user, stock=order.stock).first()
                if not portfolio:
                    print("Portfolio not found. Skipping.")
                    continue
 
                if portfolio.quantity < quantity:
                    print(f"Not enough quantity to sell. Owned: {portfolio.quantity}, Needed: {quantity}")
                    continue
 
                if order.order_type == 'LIMIT':
                    print(f"Limit Price: {order.limit_price}")
                    if current_price < Decimal(order.limit_price):
                        print("Current price is below limit price. Skipping.")
                        continue
 
                with db_transaction.atomic():
                    print("Executing SELL transaction in DB...")
 
                    revenue = current_price * quantity
                    user.balance += revenue
                    user.save()
                    print(f"Added revenue. New balance: {user.balance}")
 
                    portfolio.quantity -= quantity
                    if portfolio.quantity == 0:
                        portfolio.delete()
                        print("Portfolio entry deleted (quantity became zero).")
                    else:
                        portfolio.save()
                        print(f"Updated portfolio. Remaining quantity: {portfolio.quantity}")
 
                    Transaction.objects.create(
                        user=user,
                        sstock=order.stock,
                        transaction_type='SELL',
                        quantity=quantity,
                        price=current_price,
                        order_category=order.order_type
                    )
                    print("Transaction record created.")
 
                    order.executed = True
                    order.save()
                    print("Order marked as executed.")
 
        except Exception as e:
            print(f"Error processing order {order.id}: {e}")
 
    print("\nFinished processing all pending orders.")
 
 