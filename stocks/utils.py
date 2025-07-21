import yfinance as yf
import json
import logging
from datetime import datetime, timedelta
from django.conf import settings

logger = logging.getLogger(__name__)

# In-memory Caching Mechanism
live_stock_cache = {}
LIVE_CACHE_DURATION = timedelta(seconds=settings.LIVE_CACHE_DURATION)

detailed_info_cache = {}
DETAILED_CACHE_DURATION = timedelta(seconds=settings.DETAILED_CACHE_DURATION)

historical_data_cache = {}
HISTORICAL_CACHE_DURATION = timedelta(seconds=settings.HISTORICAL_CACHE_DURATION)

def get_cached_data(cache, key, duration):
    if key in cache:
        cached_time, data = cache[key]
        if datetime.now() - cached_time < duration:
            logger.info(f"Serving {key} from in-memory cache (fresh data).")
            return data
    return None

def set_cached_data(cache, key, data):
    cache[key] = (datetime.now(), data)
    logger.info(f"Cached data for {key} in-memory.")

def get_live_stock_data(symbol):
    symbol = symbol.upper()
    cached_data = get_cached_data(live_stock_cache, symbol, LIVE_CACHE_DURATION)
    if cached_data:
        return cached_data

    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        if not info:
            logger.warning(f"No info returned by yfinance for {symbol} after fetch.")
            return None, None

        current_price = info.get('currentPrice') or info.get('regularMarketPrice')
        company_name = info.get('longName') or info.get('shortName')

        if current_price is None or company_name is None:
            logger.warning(f"Missing price or name for {symbol}. Info: {info}")
            return None, None

        data_to_cache = (float(current_price), company_name)
        set_cached_data(live_stock_cache, symbol, data_to_cache)
        logger.info(f"Fetched live data for {symbol} from yfinance and cached.")
        return data_to_cache
    except Exception as e:
        logger.error(f"Error fetching live data for {symbol} from yfinance: {e}", exc_info=True)
        return None, None

def get_detailed_stock_info(symbol):
    symbol = symbol.upper()
    cached_data = get_cached_data(detailed_info_cache, symbol, DETAILED_CACHE_DURATION)
    if cached_data:
        return cached_data

    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        if not info:
            logger.warning(f"No detailed info found for {symbol}. Raw info: {info}")
            return None

        detailed_info = {
            'symbol': symbol,
            'companyName': info.get('longName') or info.get('shortName', 'N/A') + ' (Info Unavailable)',
            'description': info.get('longBusinessSummary', 'No description available.'),
            'industry': info.get('industry', 'N/A'),
            'sector': info.get('sector', 'N/A'),
            'currentPrice': info.get('currentPrice') or info.get('regularMarketPrice', 0.0),
            'marketCap': info.get('marketCap', 'N/A'),
            'peRatio': info.get('trailingPE', 'N/A'),
            'dividendYield': f"{info.get('dividendYield', 0) * 100:.2f}%" if info.get('dividendYield') else 'N/A',
            'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0.0),
            'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0.0),
            'volume': info.get('volume', 'N/A'),
            'averageDailyVolume10Day': info.get('averageDailyVolume10Day', 'N/A'),
            'currency': info.get('currency', settings.DEFAULT_CURRENCY)
        }

        for key in ['marketCap', 'volume', 'averageDailyVolume10Day']:
            value = detailed_info.get(key)
            if isinstance(value, (int, float)):
                if value >= 1_000_000_000_000:
                    detailed_info[key] = f"{value / 1_000_000_000_000:.2f}T"
                elif value >= 1_000_000_000:
                    detailed_info[key] = f"{value / 1_000_000_000:.2f}B"
                elif value >= 1_000_000:
                    detailed_info[key] = f"{value / 1_000_000:.2f}M"
                elif value >= 1_000:
                    detailed_info[key] = f"{value / 1_000:.2f}K"
                else:
                    detailed_info[key] = f"{value:,.2f}"

        set_cached_data(detailed_info_cache, symbol, detailed_info)
        logger.info(f"Fetched detailed info for {symbol} from yfinance and cached.")
        return detailed_info
    except Exception as e:
        logger.error(f"Error fetching detailed info for {symbol} from yfinance: {e}", exc_info=True)
        return None

def get_historical_prices(symbol, period="1y", interval="1d"):
    symbol = symbol.upper()
    cache_key = f"{symbol}_{period}_{interval}"
    cached_data = get_cached_data(historical_data_cache, cache_key, HISTORICAL_CACHE_DURATION)
    if cached_data:
        return cached_data

    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period, interval=interval)

        if hist.empty:
            logger.warning(f"No historical data for {symbol} with period={period}, interval={interval}.")
            return None

        historical_data = []
        for index, row in hist.iterrows():
            historical_data.append({
                'date': index.strftime('%Y-%m-%d'),
                'close': round(row['Close'], 2)
            })

        set_cached_data(historical_data_cache, cache_key, historical_data)
        logger.info(f"Fetched historical data for {symbol} from yfinance and cached.")
        return historical_data

    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {e}", exc_info=True)
        return None
