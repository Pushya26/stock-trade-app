from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, status
from .models import Stock, Portfolio, Transaction, PendingOrder
from django.shortcuts import get_object_or_404
from decimal import Decimal
import yfinance as yf
from trade_engine.execute_orders import execute_pending_orders
from .utils import is_market_open

class TradeViewSet(viewsets.ViewSet):

    def get_company_name(self, symbol):
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            return (
                info.get('longName') or 
                info.get('shortName') or 
                info.get('displayName') or 
                symbol.upper()
            )
        except Exception:
            return symbol.upper()

    @action(detail=False, methods=['post'])
    def buy(self, request):
        user = request.user
        symbol = request.data['symbol']
        quantity = int(request.data['quantity'])
        order_type = request.data.get('order_type', 'MARKET').upper()
        limit_price = request.data.get('limit_price')

        company_name = self.get_company_name(symbol)
        stock, created = Stock.objects.get_or_create(
            symbol=symbol.upper(), defaults={'name': company_name}
        )

        if not created and stock.name == stock.symbol:
            stock.name = company_name
            stock.save()

        try:
            ticker = yf.Ticker(symbol)
            price = Decimal(ticker.info.get('regularMarketPrice') or 0)
        except Exception:
            price = Decimal('0')

        if price <= 0:
            return Response({'error': 'Invalid stock price'}, status=400)

        if order_type == 'LIMIT' or not is_market_open():
            PendingOrder.objects.create(
                user=user,
                stock=stock,
                quantity=quantity,
                side='BUY',
                order_type=order_type,
                price=price,
                limit_price=limit_price if limit_price else None
            )
            return Response({'message': f'{order_type} order placed. Will execute when conditions are met.'}, status=200)

        cost = price * quantity
        if user.balance < cost:
            return Response({'error': 'Insufficient balance'}, status=400)

        user.balance -= cost
        user.save()

        portfolio, _ = Portfolio.objects.get_or_create(user=user, stock=stock)
        portfolio.quantity += quantity
        portfolio.save()

        Transaction.objects.create(
            user=user,
            sstock=stock,
            transaction_type='BUY',
            quantity=quantity,
            price=price,
            limit_price=limit_price if limit_price else None,
            order_category=order_type
        )

        return Response({'message': 'Stock bought successfully'}, status=200)

    @action(detail=False, methods=['post'])
    def sell(self, request):
        user = request.user
        symbol = request.data['symbol']
        quantity = int(request.data['quantity'])
        order_type = request.data.get('order_type', 'MARKET').upper()
        limit_price = request.data.get('limit_price')

        stock = get_object_or_404(Stock, symbol=symbol.upper())
        portfolio = get_object_or_404(Portfolio, user=user, stock=stock)

        if portfolio.quantity < quantity:
            return Response({'error': 'Not enough stock to sell'}, status=400)

        try:
            ticker = yf.Ticker(symbol)
            price = Decimal(ticker.info.get('regularMarketPrice') or 0)
        except Exception:
            price = Decimal('0')

        if price <= 0:
            return Response({'error': 'Invalid stock price'}, status=400)

        if order_type == 'LIMIT' or not is_market_open():
            PendingOrder.objects.create(
                user=user,
                stock=stock,
                quantity=quantity,
                side='SELL',
                order_type=order_type,
                price=price,
                limit_price=limit_price if limit_price else None
            )
            return Response({'message': f'{order_type} order placed. Will execute when conditions are met.'}, status=200)

        revenue = price * quantity
        user.balance += revenue
        user.save()

        portfolio.quantity -= quantity
        if portfolio.quantity == 0:
            portfolio.delete()
        else:
            portfolio.save()

        Transaction.objects.create(
            user=user,
            sstock=stock,
            transaction_type='SELL',
            quantity=quantity,
            price=price,
            limit_price=limit_price if limit_price else None,
            order_category=order_type
        )

        return Response({'message': 'Stock sold successfully'}, status=200)
    @action(detail=False, methods=['get'])
    def transactions(self, request):
        user = request.user
        txns = Transaction.objects.filter(user=user).order_by('-timestamp')[:10]
        data = [
            {
                'id': txn.id,
                'type': txn.transaction_type,
                'symbol': txn.sstock.symbol,
                'quantity': txn.quantity,
                'price': float(txn.price),
                'total': float(txn.price * txn.quantity),
                'timestamp': txn.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            } for txn in txns
        ]
        return Response(data, status=status.HTTP_200_OK)
    @action(detail=False, methods=['GET'])
    def portfolio_information(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'User not authenticated'}, status=401)
 
        holdings = Portfolio.objects.filter(user=user)
        portfolio_data = {item.stock.symbol: item.quantity for item in holdings}
 
        data = []
        account_value = Decimal('0')
        market_value = Decimal('0')
        todays_changes = Decimal('0')
        buying_power = Decimal('0')
 
        cash = Decimal(user.balance) if hasattr(user, 'balance') else Decimal('10000')
        margin = Decimal('5000')
        pending_proceeds = Decimal('2000')
 
        for p in holdings:
            symbol = p.stock.symbol
            name = p.stock.name
            quantity = p.quantity
           
            # Update stock name if it's still showing the symbol
            if name == symbol:
                company_name = self.get_company_name(symbol)
                p.stock.name = company_name
                p.stock.save()
                name = company_name
 
            buy_transactions = Transaction.objects.filter(
                user=user, sstock=p.stock, transaction_type='BUY'
            )
            total_quantity = sum(t.quantity for t in buy_transactions)
            total_spent = sum(t.quantity * t.price for t in buy_transactions)
            buy_price = total_spent / total_quantity if total_quantity > 0 else Decimal('0')
 
            try:
                ticker = yf.Ticker(symbol)
                current_price = Decimal(ticker.info.get("regularMarketPrice", 0))
                prev_close = Decimal(ticker.info.get("previousClose", 0))
            except Exception:
                current_price = prev_close = Decimal('0')
 
            today_change = current_price - prev_close
            holding_value = quantity * current_price
            invested = quantity * buy_price
            pl = holding_value - invested
            day_pl = quantity * today_change
 
            account_value += invested
            market_value += holding_value
            todays_changes += day_pl
            buying_power += pl
 
            data.append({
                "symbol": symbol,
                "name": name,  # This will now be the actual company name
                "quantity": quantity,
                "buy_price": str(buy_price),
                "market_price": str(current_price),
                "holding_value": str(holding_value),
                "pl": str(pl),
                "today_pl": str(day_pl),
            })
 
        summary = {
            "account_value": str(account_value),
            "market_value": str(market_value),
            "todays_changes": str(todays_changes),
            "buying_power": str(buying_power),
        }
 
        return Response({
            "summary": summary,
            "portfolio": data,
            "portfolio_snapshot": portfolio_data,
            "cash": float(cash)
        }, status=status.HTTP_200_OK)
 

    @action(detail=False, methods=['get'])
    def pending_orders(self, request):
        user = request.user

        if is_market_open():
            execute_pending_orders()

        orders = PendingOrder.objects.filter(user=user, executed=False).order_by('-created_at')
        data = [{
            'symbol': order.stock.symbol,
            'type': order.side,
            'quantity': order.quantity,
            'order_type': order.order_type,
            'limit_price': float(order.limit_price) if order.limit_price else None,
            'created_at': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        } for order in orders]

        return Response({'pending_orders': data}, status=200)

    @action(detail=False, methods=['get'])
    def orders(self, request):
        user = request.user
        pending_orders = PendingOrder.objects.filter(user=user, executed=False).order_by('-created_at')
        transactions = Transaction.objects.filter(user=user).order_by('-timestamp')

        open_orders = [{
            'id': order.id,
            'symbol': order.stock.symbol,
            'order_type': order.order_type,
            'side': order.side,
            'quantity': order.quantity,
            'price': float(order.price),
            'limit_price': float(order.limit_price) if order.limit_price else None,
            'status': 'pending',
            'created_at': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        } for order in pending_orders]

        order_history = [{
            'id': txn.id,
            'symbol': txn.sstock.symbol,
            'order_type': txn.order_category,
            'side': txn.transaction_type,
            'quantity': txn.quantity,
            'price': float(txn.price),
            # 'limit_price': float(txn.limit_price) if txn.limit_price else None,
            'status': 'executed',
            'timestamp': txn.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        } for txn in transactions]

        return Response({
            'open_orders': open_orders,
            'order_history': order_history
        }, status=200)

    @action(detail=True, methods=['delete'])
    def cancel_order(self, request, pk=None):
        user = request.user
        try:
            order = PendingOrder.objects.get(id=pk, user=user, executed=False)
            order.delete()
            return Response({'message': 'Order cancelled successfully'}, status=200)
        except PendingOrder.DoesNotExist:
            return Response({'error': 'Order not found or already executed'}, status=404)


    # @action(detail=False, methods=['POST'])
    # # @action(detail=False, methods=['GET'], permission_classes=[AllowAny])
    # def place_limit_buy_order(self, request):
    #     # user = User.objects.get(email="naikpradnya73@gmail.com")
    #     #  Hardcoded values for testing
    #     # symbol = 'TYT.L'
    #     # quantity = 1
    #     # print(f"Buying {quantity} of {symbol}")
    #     # limit_price = Decimal("2488")
    #     user=request.user,
    #     symbol = request.data.get('symbol')
    #     quantity = int(request.data.get('quantity'))
    #     limit_price = models.DecimalField(max_digits=10, decimal_places=2)
 
    #     # symbol = request.data['symbol'].upper()
 
    #     # ✅ Ensure stock exists (use symbol as default name if new)
    #     stock, _ = Stock.objects.get_or_create(symbol=symbol, defaults={'name': symbol})
 
 
    #     if not symbol.endswith(".L"):
    #         symbol += ".L"
 
    #     try:
    #         stock = Stock.objects.get(symbol=symbol)
    #     except Stock.DoesNotExist:
    #         return Response({"error": "Invalid stock symbol"}, status=400)
 
    #     LimitOrder.objects.create(
    #         user=user,
    #         stock=stock,
    #         quantity=quantity,
    #         limit_price=limit_price,
    #         order_type='BUY'
    #     )
 
    #     return Response({"message": "Limit order placed successfully"})
 
 
    # @action(detail=False, methods=['post'])
    # # @action(detail=False, methods=['GET'], permission_classes=[AllowAny])
    # def place_limit_sell_order(self, request):
    #     user = request.user
    #     # user = User.objects.get(email="ummihani2002@gmail.com")
    #     symbol = request.data['symbol'].upper()
    #     # symbol = 'EXPN.L'
    #     # quantity = 1
    #     # print(f"Selling {quantity} of {symbol}")
    #     # limit_price = Decimal("3777.00")
 
    #     quantity = int(request.data['quantity'])
    #     limit_price = Decimal(request.data['limit_price'])
 
    #     if not symbol.endswith(".L"):
    #         symbol += ".L"
 
    #     stock, _ = Stock.objects.get_or_create(symbol=symbol, defaults={'name': symbol})
 
    #     # Optional: check if user has enough quantity to sell
    #     portfolio = Portfolio.objects.filter(user=user, stock=stock).first()
    #     if not portfolio or portfolio.quantity < quantity:
    #         return Response({'error': 'Insufficient stock in portfolio to place sell order'}, status=400)
 
    #     LimitOrder.objects.create(
    #         user=user,
    #         stock=stock,
    #         quantity=quantity,
    #         limit_price=limit_price,
    #         order_type='SELL'  # ✅ Correct field name
    #     )
 
    #     return Response({'message': 'Limit sell order placed successfully'})
