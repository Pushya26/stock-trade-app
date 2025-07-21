# from celery import shared_task
# from .models import LimitOrder, Portfolio, Transaction
# from stocks.utils import fetch_stock_price
# from django.utils import timezone
# from django.db import transaction
# from decimal import Decimal
 
 
# @shared_task
# def check_and_execute_buy_orders():
#     print("🚀 Celery task started: check_and_execute_limit_orders")
 
#     orders = LimitOrder.objects.filter(is_executed=False, order_type='BUY')
#     print(f"🧾 Found {orders.count()} unexecuted limit orders")
 
#     for order in orders:
#         print(f"🔍 Checking order ID {order.id} for stock {order.stock.symbol}")
 
#         current_price = fetch_stock_price(order.stock.symbol)
#         print(f"📈 Current price for {order.stock.symbol}: {current_price}")
#         # print(f"DEBUG ➜ type of current_price['price']: {type(current_price['price'])}, value: {current_price['price']}")
 
#         if current_price is None:
#             print(f"⚠️ Skipping order ID {order.id} due to unavailable price")
#             continue
 
#         if current_price["price"] <= float(order.limit_price):
#             print(f"✅ Executing order ID {order.id} (limit: {order.limit_price}, current: {current_price})")
 
#             total_cost = Decimal(str(current_price["price"])) * order.quantity
#             user = order.user
 
#             if user.balance >= total_cost:
#                 with transaction.atomic():
#                     print(f"💰 Deducting {total_cost} from user {user.email}'s balance")
 
#                     user.balance -= total_cost
#                     user.save()
 
#                     portfolio, _ = Portfolio.objects.get_or_create(user=user, stock=order.stock)
#                     portfolio.quantity += order.quantity
#                     portfolio.save()
 
#                     # ✅ Log the transaction
#                     Transaction.objects.create(
#                         user=user,
#                         sstock=order.stock,
#                         transaction_type='BUY',
#                         quantity=order.quantity,
#                         price=Decimal(str(current_price["price"]))
#                     )
#                     print(f"🧾 Transaction logged: {order.quantity} of {order.stock.symbol} at {current_price['price']}")
 
 
#                     order.is_executed = True
#                     order.executed_at = timezone.now()
#                     order.save()
 
#                     print(f"📦 Order ID {order.id} executed successfully")
#             else:
#                 print(f"❌ Not enough balance for user {user.email} to execute order ID {order.id}")
#         else:
#             print(f"⏳ Order ID {order.id} not executed: current price {current_price} > limit {order.limit_price}")
 
#     print("✅ Celery task completed: check_and_execute_limit_orders")
 
 
# @shared_task
# def check_and_execute_sell_orders():
#     print("🚀 Celery task started: check_and_execute_sell_orders")
 
#     orders = LimitOrder.objects.filter(is_executed=False, order_type='SELL')
#     print(f"🧾 Found {orders.count()} unexecuted SELL limit orders")
 
#     for order in orders:
#         print(f"🔍 Checking SELL order ID {order.id} for stock {order.stock.symbol}")
 
#         current_price = fetch_stock_price(order.stock.symbol)
#         print(f"📈 Current price for {order.stock.symbol}: {current_price}")
 
#         if current_price is None:
#             print(f"⚠️ Skipping order ID {order.id} due to unavailable price")
#             continue
 
#         if Decimal(str(current_price['price'])) >= order.limit_price:
#             print(f"✅ Executing SELL order ID {order.id} (limit: {order.limit_price}, current: {current_price['price']})")
#             user = order.user
 
#             try:
#                 portfolio = Portfolio.objects.get(user=user, stock=order.stock)
#                 print(f"📦 Portfolio found for user {user.email} with quantity {portfolio.quantity}")
#             except Portfolio.DoesNotExist:
#                 print(f"❌ Portfolio does not exist for user {user.email} and stock {order.stock.symbol}")
#                 continue
 
#             if portfolio.quantity >= order.quantity:
#                 with transaction.atomic():
#                     print(f"🧮 Selling {order.quantity} of {order.stock.symbol} from user {user.email}'s portfolio")
 
#                     portfolio.quantity -= order.quantity
#                     portfolio.save()
 
#                     revenue = Decimal(str(current_price['price'])) * order.quantity
#                     user.balance += revenue
#                     user.save()
 
#                     Transaction.objects.create(
#                         user=user,
#                         sstock=order.stock,
#                         transaction_type='SELL',
#                         quantity=order.quantity,
#                         price=Decimal(str(current_price['price']))
#                     )
#                     print(f"🧾 Transaction logged: SELL {order.quantity} of {order.stock.symbol} at {current_price['price']}")
 
#                     order.is_executed = True
#                     order.executed_at = timezone.now()
#                     order.save()
 
#                     print(f"✅ Order ID {order.id} marked as executed at {order.executed_at}")
#             else:
#                 print(f"❌ Not enough stock to sell. Required: {order.quantity}, Available: {portfolio.quantity}")
#         else:
#             print(f"⏳ Order ID {order.id} not executed: current price {current_price['price']} < limit {order.limit_price}")
 
#     print("✅ Celery task completed: check_and_execute_sell_orders")
 
 