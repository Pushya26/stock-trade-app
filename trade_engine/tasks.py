from celery import shared_task
import os
import csv
import yfinance as yf
import feedparser
from datetime import datetime
from django.core.cache import cache
from .models import LimitOrder, Portfolio, Transaction
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
import time
import logging
import re
from difflib import SequenceMatcher
import asyncio
import aiohttp
 
 
# In-memory cache for demo (replace with Redis or DB for production)
COMPANY_NEWS_CACHE = {}

@shared_task
def fetch_and_cache_all_company_news(chunk_size=10, delay=2):
    print("[Celery] Starting chunked fetch_and_cache_all_company_news task...")
    csv_path = os.path.join(os.path.dirname(__file__), '../stocks/stocks_symbols.csv')
    companies = []
    try:
        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                symbol = row.get('symbol', '').strip()
                name = row.get('name', '').strip()
                if symbol:
                    companies.append({'symbol': symbol, 'name': name})
    except Exception as e:
        print(f"[Celery] Error reading CSV: {e}")
        return
    print(f"[Celery] Found {len(companies)} companies in CSV.")

    total_with_news = 0
    total_no_news = 0

    for i in range(0, len(companies), chunk_size):
        batch = companies[i:i+chunk_size]
        print(f"[Celery] Processing batch {i//chunk_size+1} ({len(batch)} companies)...")
        for company in batch:
            symbol = company['symbol']
            name = company['name']
            news = []
            try:
                search_url = f'https://uk.finance.yahoo.com/rss/headline?s={symbol}'
                feed = feedparser.parse(search_url)
                print(f"[Celery] {symbol}: {len(feed.entries)} entries found")
                for entry in feed.entries[:10]:
                    news.append({
                        'title': entry.get('title', ''),
                        'description': entry.get('summary', ''),
                        'published_at': entry.get('published', entry.get('updated', '')),
                        'url': entry.get('link', ''),
                        'source': 'Yahoo Finance UK',
                    })
                if news:
                    cache.set(f"company_news_{symbol}", news, timeout=3600)  # cache for 1 hour
                    total_with_news += 1
                else:
                    total_no_news += 1
            except Exception as e:
                print(f"[Celery] Error fetching news for {symbol}: {e}")
        print(f"[Celery] Sleeping for {delay} seconds before next batch...")
        time.sleep(delay)
    print(f"[Celery] Finished fetching and caching company news.")
    print(f"[Celery] Companies with news: {total_with_news}, without news: {total_no_news}")

# Utility to get cached news for a company (for use in views)
def get_cached_company_news(symbol, top_n=3):
    news = cache.get(f"company_news_{symbol}", [])
    # Sort by published_at descending
    def parse_date(dt):
        try:
            return datetime.strptime(dt, '%a, %d %b %Y %H:%M:%S %Z')
        except Exception:
            try:
                return datetime.strptime(dt, '%a, %d %b %Y %H:%M:%S %z')
            except Exception:
                return datetime.min
    news_sorted = sorted(news, key=lambda x: parse_date(x['published_at']), reverse=True)
    return news_sorted[:top_n]
 
 
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
 
 
@shared_task
def fetch_and_cache_bulk_rss_articles():
    import feedparser
    import logging
    from django.core.cache import cache
    from datetime import datetime
    import re
    import csv
    import os
    from difflib import SequenceMatcher
    
    # Build tag map from stocks_symbols.csv
    csv_path = os.path.join(os.path.dirname(__file__), '../stocks/stocks_symbols.csv')
    tag_map = {}
    try:
        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                symbol = row.get('symbol', '').strip()
                name = row.get('name', '').strip()
                if not symbol or not name:
                    continue
                name_keywords = re.sub(r'\b(Plc|Ltd|Limited|Group|Holdings|Corporation|Trust|Company|Fund|Ord|Ordinary|Shares|ETF|ETFS|Public|Incorporated|Investment|Vct|Tst|SICAV|S.A.|S.A|S.p.A.|S.p.A|S.A.S.|S.A.S|S.A.B.|S.A.B|S.A.C.|S.A.C|S.A.E.|S.A.E|S.A.I.|S.A.I|S.A.L.|S.A.L|S.A.P.I.|S.A.P.I|S.A.R.L.|S.A.R.L|S.A.S.U.|S.A.S.U|S.A.S.P.|S.A.S.P|S.A.S.S.|S.A.S.S|S.A.S.T.|S.A.S.T|S.A.S.V.|S.A.S.V|S.A.S.W.|S.A.S.W|S.A.S.X.|S.A.S.X|S.A.S.Y.|S.A.S.Y|S.A.S.Z.|S.A.S.Z|S.A.S.|S.A.S|S.A.|S.A|S.A.B.|S.A.B|S.A.C.|S.A.C|S.A.E.|S.A.E|S.A.I.|S.A.I|S.A.L.|S.A.L|S.A.P.I.|S.A.P.I|S.A.R.L.|S.A.R.L|S.A.S.U.|S.A.S.U|S.A.S.P.|S.A.S.P|S.A.S.S.|S.A.S.S|S.A.S.T.|S.A.S.T|S.A.S.V.|S.A.S.V|S.A.S.W.|S.A.S.W|S.A.S.X.|S.A.S.X|S.A.S.Y.|S.A.S.Y|S.A.S.Z.|S.A.S.Z|Inc|Incorporated|Corp|Corporation|LLC|LP|LLP|L.P.|L.P|L.L.C.|L.L.C|L.L.P.|L.L.P|N.V.|N.V|NV|AG|S.p.A.|S.p.A|S.A.|S.A|S.A.B.|S.A.B|S.A.C.|S.A.C|S.A.E.|S.A.E|S.A.I.|S.A.I|S.A.L.|S.A.L|S.A.P.I.|S.A.P.I|S.A.R.L.|S.A.R.L|S.A.S.U.|S.A.S.U|S.A.S.P.|S.A.S.P|S.A.S.S.|S.A.S.S|S.A.S.T.|S.A.S.T|S.A.S.V.|S.A.S.V|S.A.S.W.|S.A.S.W|S.A.S.X.|S.A.S.X|S.A.S.Y.|S.A.S.Y|S.A.S.Z.|S.A.S.Z|Trust|ETF|ETFS|Fund|Vct|Tst|SICAV|SICAV|Trust|ETF|ETFS|Fund|Vct|Tst|SICAV|SICAV)\b', '', name, flags=re.IGNORECASE)
                name_keywords = [w for w in re.split(r'\W+', name_keywords) if w]
                tags = [symbol, name] + name_keywords
                tag_map[symbol] = list(set([t for t in tags if t]))
    except Exception as e:
        logging.error(f'[Celery] Error building tag map from CSV: {e}')
        tag_map = {}
    
    rss_feeds = [
        ('Yahoo Finance UK', 'https://uk.finance.yahoo.com/rss/'),
        ('City A.M. Business', 'https://www.cityam.com/feed/'),
        ('The Guardian UK Business', 'https://www.theguardian.com/uk/business/rss'),
        ('Financial Times (UK)', 'https://www.ft.com/?format=rss'),
        ('BBC Business (UK)', 'http://feeds.bbci.co.uk/news/business/rss.xml'),
    ]
    
    logging.info('[Celery] Starting bulk RSS fetch for %d feeds', len(rss_feeds))
    print(f'[Celery] Starting bulk RSS fetch for {len(rss_feeds)} feeds')
    
    all_articles = []
    now = datetime.utcnow().isoformat()
    
    def fuzzy_match(tag, text):
        tag_clean = re.sub(r'[^a-zA-Z0-9 ]', '', tag.lower())
        text_clean = re.sub(r'[^a-zA-Z0-9 ]', '', text.lower())
        if tag_clean in text_clean:
            return True
        ratio = SequenceMatcher(None, tag_clean, text_clean).ratio()
        return (len(tag_clean) < 6 and ratio > 0.85) or (len(tag_clean) >= 6 and ratio > 0.75)

    async def fetch_feed(session, name, url, max_retries=2):
        attempt = 0
        while attempt <= max_retries:
            try:
                async with session.get(url, timeout=15) as resp:
                    content = await resp.read()
                    return (name, content, None)
            except Exception as e:
                attempt += 1
                if attempt > max_retries:
                    logging.error(f'[Celery] Error fetching {name} (attempt {attempt}): {e}')
                    return (name, None, str(e))
                else:
                    logging.warning(f'[Celery] Retry {attempt} for {name} due to error: {e}')

    async def fetch_all_feeds():
        async with aiohttp.ClientSession() as session:
            tasks = [fetch_feed(session, name, url) for name, url in rss_feeds]
            return await asyncio.gather(*tasks)

    # Run async feed fetching
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    feed_results = loop.run_until_complete(fetch_all_feeds())
    loop.close()

    feed_summary = []
    for name, content, error in feed_results:
        if not content:
            feed_summary.append({'feed': name, 'status': 'FAILED', 'error': error, 'articles': 0})
            continue
        try:
            feed = feedparser.parse(content)
            count = 0
            for entry in feed.entries:
                article_text = (entry.get('title', '') + ' ' + entry.get('summary', entry.get('description', '')))
                matched_symbols = []
                for symbol, tags in tag_map.items():
                    for tag in tags:
                        if fuzzy_match(tag, article_text):
                            matched_symbols.append(symbol)
                            break
                # Always add the article, even if matched_symbols is empty
                article = {
                    'timestamp': now,
                    'category': entry.get('category', ''),
                    'source': name,
                    'title': entry.get('title', ''),
                    'summary': entry.get('summary', entry.get('description', '')),
                    'url': entry.get('link', ''),
                    'tags': list(set(matched_symbols)),
                }
                all_articles.append(article)
                count += 1
            feed_summary.append({'feed': name, 'status': 'OK', 'error': None, 'articles': count})
            logging.info(f'[Celery] {name}: {count} articles parsed')
            print(f'[Celery] {name}: {count} articles parsed')
        except Exception as e:
            feed_summary.append({'feed': name, 'status': 'FAILED', 'error': str(e), 'articles': 0})
            logging.error(f'[Celery] Error parsing {name}: {e}')
            print(f'[Celery] Error parsing {name}: {e}')

    print(f"DEBUG: all_articles length before caching: {len(all_articles)}")
    cache.set('bulk_rss_articles', all_articles, timeout=3600)  # Cache for 1 hour
    logging.info(f'[Celery] Cached {len(all_articles)} articles in Redis')
    print(f'[Celery] Cached {len(all_articles)} articles in Redis')
    logging.info('[Celery] Bulk RSS fetch and cache complete')
    print('[Celery] Bulk RSS fetch and cache complete')

    # Log summary
    summary_lines = [f"Feed summary:"]
    for s in feed_summary:
        if s['status'] == 'OK':
            summary_lines.append(f"  [OK] {s['feed']}: {s['articles']} articles")
        else:
            summary_lines.append(f"  [FAILED] {s['feed']}: {s['error']}")
    logging.info('\n'.join(summary_lines))
    print('\n'.join(summary_lines))
 
 