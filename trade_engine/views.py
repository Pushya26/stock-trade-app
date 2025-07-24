from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework import viewsets, status
from .models import Stock, Portfolio, Transaction, PendingOrder
from django.shortcuts import get_object_or_404
from decimal import Decimal
import yfinance as yf
from trade_engine.execute_orders import execute_pending_orders
from .utils import is_market_open
from rest_framework.permissions import AllowAny
import requests
import feedparser
from datetime import datetime
import csv
import os
import logging
from rest_framework.pagination import PageNumberPagination
from django.core.cache import cache
from dateutil.parser import parse as parse_date
from django.http import JsonResponse

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

@api_view(['GET'])
@permission_classes([AllowAny])
def fresh_market_news(request):
    """
    Fetches the latest 10 news articles from Yahoo Finance UK (https://uk.finance.yahoo.com/rss/topstories)
    and optionally Financial Juice (UK/Europe-focused if available).
    Returns a list of articles with fields: title, description, published_at, url, image_url, source.
    """
    articles = []
    # Yahoo Finance UK
    yahoo_rss_url = 'https://uk.finance.yahoo.com/rss/topstories'
    feed = feedparser.parse(yahoo_rss_url)
    for entry in feed.entries[:10]:
        articles.append({
            'title': entry.get('title', ''),
            'description': entry.get('summary', ''),
            'published_at': entry.get('published', entry.get('updated', '')),
            'url': entry.get('link', ''),
            'image_url': entry.get('media_content', [{}])[0].get('url', '') if 'media_content' in entry else '',
            'source': 'Yahoo Finance UK',
        })

    # Optionally: Financial Juice UK/Europe news (if you have an endpoint or API key)
    # Example (pseudo-code, replace with real endpoint if available):
    # fj_url = 'https://www.financialjuice.com/api/news?region=uk,eu'
    # try:
    #     fj_response = requests.get(fj_url, timeout=5)
    #     if fj_response.ok:
    #         fj_data = fj_response.json()
    #         for item in fj_data.get('news', []):
    #             if 'uk' in item.get('region', '').lower() or 'europe' in item.get('region', '').lower():
    #                 articles.append({
    #                     'title': item.get('title', ''),
    #                     'description': item.get('summary', ''),
    #                     'published_at': item.get('published_at', ''),
    #                     'url': item.get('url', ''),
    #                     'image_url': item.get('image_url', ''),
    #                     'source': 'Financial Juice',
    #                 })
    # except Exception:
    #     pass

    return Response(articles)

@api_view(['GET'])
@permission_classes([AllowAny])
def top_movers(request):
    """
    Returns the top 5 gainers and top 5 losers from the LSE (demo: first 10 stocks in stocks_symbols.csv).
    Each entry: symbol, name, current_price, previous_close, percent_change.
    Adds diagnostics and error logging for debugging.
    """
    logger = logging.getLogger(__name__)
    debug_info = []
    # Path to CSV
    csv_path = os.path.join(os.path.dirname(__file__), '../stocks/stocks_symbols.csv')
    symbols = []
    try:
        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for i, row in enumerate(reader):
                if i >= 10:  # Limit for diagnostics
                    break
                symbol = row['symbol']
                symbols.append(symbol)
        if not symbols:
            debug_info.append('CSV loaded but no symbols found.')
            return Response({'gainers': [], 'losers': [], 'debug': debug_info, 'error': 'No symbols found in CSV.'}, status=500)
    except Exception as e:
        debug_info.append(f'Failed to read symbols: {e}')
        return Response({'gainers': [], 'losers': [], 'debug': debug_info, 'error': f'Failed to read symbols: {e}'}, status=500)

    import yfinance as yf
    movers = []
    for symbol in symbols:
        try:
            debug_info.append(f'Fetching {symbol}')
            ticker = yf.Ticker(symbol)
            info = ticker.info
            price = info.get('regularMarketPrice')
            prev_close = info.get('regularMarketPreviousClose') or info.get('previousClose')
            # Fetch the most up-to-date company name from yfinance
            name = (
                info.get('longName') or
                info.get('shortName') or
                info.get('displayName') or
                symbol
            )
            if price is not None and prev_close is not None and prev_close != 0:
                percent_change = ((price - prev_close) / prev_close) * 100
                movers.append({
                    'symbol': symbol,
                    'name': name,
                    'current_price': price,
                    'previous_close': prev_close,
                    'percent_change': percent_change
                })
                debug_info.append(f'{symbol}: price={price}, prev_close={prev_close}, change={percent_change:.2f}%, name={name}')
            else:
                debug_info.append(f'{symbol}: Missing price or prev_close (price={price}, prev_close={prev_close})')
        except Exception as e:
            debug_info.append(f'{symbol}: yfinance error: {e}')
            continue
    # Sort for gainers (highest to lowest) and losers (lowest to highest)
    movers_sorted_desc = sorted(movers, key=lambda x: x['percent_change'], reverse=True)
    movers_sorted_asc = sorted(movers, key=lambda x: x['percent_change'])
    gainers = movers_sorted_desc[:5]
    losers = movers_sorted_asc[:5]
    if not gainers and not losers:
        return Response({'gainers': [], 'losers': [], 'debug': debug_info, 'error': 'No data returned from yfinance.'}, status=500)
    return Response({'gainers': gainers, 'losers': losers, 'debug': debug_info})

@api_view(['GET'])
@permission_classes([AllowAny])
def top_movers_news(request):
    """
    Fetches news for each top mover (gainers and losers) using Yahoo Finance's unofficial news API.
    Returns a dictionary mapping each symbol to its list of news articles.
    """
    # Get top movers (reuse your top_movers logic)
    top_movers_response = top_movers(request)
    # If top_movers returns a DRF Response, get .data, else use as dict
    movers_data = top_movers_response.data if hasattr(top_movers_response, 'data') else top_movers_response
    symbols = [item['symbol'] for item in movers_data.get('gainers', []) + movers_data.get('losers', [])]
    news = {}
    for symbol in symbols:
        url = f"https://query1.finance.yahoo.com/v2/finance/news?symbols={symbol}"
        try:
            resp = requests.get(url, timeout=5)
            if resp.ok:
                news_items = resp.json().get('content', [])
                articles = []
                for item in news_items:
                    articles.append({
                        'title': item.get('title', ''),
                        'summary': item.get('summary', ''),
                        'published_at': item.get('pubDate', ''),
                        'url': item.get('link', ''),
                        'source': 'Yahoo Finance',
                    })
                news[symbol] = articles
            else:
                news[symbol] = []
        except Exception as e:
            news[symbol] = []
    return Response({'news': news})

@api_view(['GET'])
@permission_classes([AllowAny])
def company_news(request, symbol):
    """
    Returns the top 3 recent news articles for the given company symbol from the cached news.
    """
    symbol = symbol.upper()
    # The original code had get_cached_company_news, which is no longer used.
    # For now, we'll return an empty list or raise an error if this endpoint is called.
    # If the intent was to fetch news from a different source, this would need to be updated.
    return Response({'symbol': symbol, 'news': []}) # Placeholder for news fetching

@api_view(['GET'])
@permission_classes([AllowAny])
def paginated_company_news(request):
    """
    Fetches news for a paginated subset of company symbols from stocks_symbols.csv using Yahoo Finance's unofficial news API.
    Supports filtering/searching by symbol or company name via the 'search' query parameter.
    Returns a dictionary mapping each symbol in the current page to its news articles.
    """
    import csv
    csv_path = os.path.join(os.path.dirname(__file__), '../stocks/stocks_symbols.csv')
    companies = []  # List of dicts: {symbol, name}
    try:
        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                companies.append({'symbol': row['symbol'], 'name': row.get('name', '')})
    except Exception as e:
        return Response({'error': f'Failed to read symbols: {e}'}, status=500)
    # Filtering/search
    search = request.query_params.get('search', '').strip().lower()
    if search:
        filtered = [c for c in companies if search in c['symbol'].lower() or search in c['name'].lower()]
    else:
        filtered = companies
    symbols = [c['symbol'] for c in filtered]
    # Paginate symbols
    paginator = PageNumberPagination()
    paginator.page_size = 20  # You can adjust this page size as needed
    result_page = paginator.paginate_queryset(symbols, request)
    news = {}
    for symbol in result_page:
        url = f"https://query1.finance.yahoo.com/v2/finance/news?symbols={symbol}"
        try:
            resp = requests.get(url, timeout=5)
            if resp.ok:
                news_items = resp.json().get('content', [])
                articles = []
                for item in news_items:
                    articles.append({
                        'title': item.get('title', ''),
                        'summary': item.get('summary', ''),
                        'published_at': item.get('pubDate', ''),
                        'url': item.get('link', ''),
                        'source': 'Yahoo Finance',
                    })
                news[symbol] = articles
            else:
                news[symbol] = []
        except Exception as e:
            news[symbol] = []
    return paginator.get_paginated_response({'news': news})

@api_view(['GET'])
@permission_classes([AllowAny])
def cached_news(request):
    """
    Returns cached news articles with advanced search and filtering.
    Query params:
      - symbol: filter by company symbol (in tags)
      - tag: filter by tag/keyword (in tags)
      - category: filter by article category
      - search: full-text search (title, summary, tags)
      - search_logic: 'and' or 'or' (default: 'or')
      - date_from: ISO date string (inclusive)
      - date_to: ISO date string (inclusive)
      - sort: 'date_desc' (default), 'date_asc'
      - limit: number of articles to return (default 20)
      - offset: start index (default 0)
    """
    articles = cache.get('bulk_rss_articles', [])
    symbol = request.GET.get('symbol', '').upper()
    tag = request.GET.get('tag', '').lower()
    category = request.GET.get('category', '').lower()
    search = request.GET.get('search', '').strip()
    search_logic = request.GET.get('search_logic', 'or').lower()
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    sort = request.GET.get('sort', 'date_desc')
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))

    # Filtering
    if symbol:
        articles = [a for a in articles if symbol in a.get('tags', [])]
    if tag:
        articles = [a for a in articles if any(tag in t.lower() for t in a.get('tags', []))]
    if category:
        articles = [a for a in articles if category in (a.get('category', '') or '').lower()]

    # Advanced search
    if search:
        keywords = [k.lower() for k in search.split() if k]
        def match(article):
            text = (article.get('title', '') + ' ' + article.get('summary', '') + ' ' + ' '.join(article.get('tags', []))).lower()
            if search_logic == 'and':
                return all(k in text for k in keywords)
            else:
                return any(k in text for k in keywords)
        articles = [a for a in articles if match(a)]

    # Date filtering
    if date_from:
        try:
            dt_from = parse_date(date_from)
            articles = [a for a in articles if a.get('timestamp') and parse_date(a['timestamp']) >= dt_from]
        except Exception:
            pass
    if date_to:
        try:
            dt_to = parse_date(date_to)
            articles = [a for a in articles if a.get('timestamp') and parse_date(a['timestamp']) <= dt_to]
        except Exception:
            pass

    # Sorting
    if sort == 'date_asc':
        articles = sorted(articles, key=lambda a: a.get('timestamp', ''))
    else:  # date_desc (default)
        articles = sorted(articles, key=lambda a: a.get('timestamp', ''), reverse=True)

    total = len(articles)
    articles = articles[offset:offset+limit]
    return Response({
        'count': total,
        'results': articles,
        'limit': limit,
        'offset': offset,
    })

def get_bulk_rss_articles(request):
    articles = cache.get('bulk_rss_articles', [])
    return JsonResponse({'articles': articles})
