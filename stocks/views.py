import os
import pandas as pd
import yfinance as yf
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .market_status import is_lse_market_open
from datetime import datetime, time, timedelta
import pytz
import logging
import json
import requests
from rest_framework import status
from .market_status import is_lse_market_open
from .utils import get_live_stock_data, get_detailed_stock_info, get_historical_prices
from .apps import company_list as app_company_list


logger = logging.getLogger(__name__)

CSV_PATH = os.path.join(os.path.dirname(__file__), 'stocks_symbols.csv')

@api_view(['GET'])
@permission_classes([AllowAny])
def market_status(request):
    status = is_lse_market_open()

    london_tz = pytz.timezone("Europe/London")
    market_open_time = time(8, 0)
    market_close_time = time(16, 30)

    return Response({
        'is_open': status,
        'message': "Market is Open" if status else "Market is Closed",
        'market_open': market_open_time.strftime("%H:%M"),
        'market_close': market_close_time.strftime("%H:%M"),
        'timezone': "Europe/London"
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_stock_info(request, symbol):
    CSV_PATH = os.path.join(os.path.dirname(__file__), 'stocks_symbols.csv')

    print("DEBUG: Request for symbol:", symbol)

    try:
        df_symbols = pd.read_csv(CSV_PATH)
        print("DEBUG: CSV loaded.")
    except Exception as e:
        print("ERROR: CSV read failed -", str(e))
        return JsonResponse({'error': f'CSV load error: {str(e)}'}, status=500)

    symbol_upper = symbol.upper().strip()
    print("DEBUG: Cleaned input symbol:", symbol_upper)

    result = []

    # Normalize symbol column
    df_symbols['symbol'] = df_symbols['symbol'].astype(str).str.upper()

    input_len = len(symbol_upper)

    # Apply dynamic matching rules
    if input_len < 6:
        max_len = 6
        matches = df_symbols[
            df_symbols['symbol'].str.startswith(symbol_upper) &
            (df_symbols['symbol'].str.len() >= input_len) &
            (df_symbols['symbol'].str.len() <= max_len)
        ]
    else:
        matches = df_symbols[
            df_symbols['symbol'].str.startswith(symbol_upper)
        ]

    matched_symbols = matches['symbol'].tolist()
    print("DEBUG: Filtered symbols:", matched_symbols)

    for sym in matched_symbols[:10]:
        try:
            stock = yf.Ticker(sym if sym.endswith(".L") else sym + ".L")
            info = stock.info
            stock_name = info.get("shortName")
            price = info.get("regularMarketPrice")
            prev_close = info.get("previousClose")

            if stock_name:
                change = (price - prev_close) if price is not None and prev_close is not None else None
                change_percent = ((change / prev_close) * 100) if change is not None and prev_close not in (None, 0) else None

                result.append({
                    'symbol': sym,
                    'name': stock_name,
                    'price': price,
                    'currency': info.get("currency"),
                    'volume': info.get("volume", 0),
                    'change': round(change, 2) if change is not None else None,
                    'changePercent': round(change_percent, 2) if change_percent is not None else None
                })

        except Exception as e:
            print(f"ERROR: Failed to fetch {sym} -", str(e))
            result.append({'symbol': sym, 'error': str(e)})

    # Fallback: if exact symbol not in list, try Yahoo
    if symbol_upper not in matched_symbols:
        try:
            stock = yf.Ticker(symbol_upper if symbol_upper.endswith(".L") else symbol_upper + ".L")
            info = stock.info
            stock_name = info.get("shortName")
            price = info.get("regularMarketPrice")
            prev_close = info.get("previousClose")

            if stock_name and price is not None and prev_close is not None:
                change = price - prev_close
                change_percent = (change / prev_close) * 100 if prev_close != 0 else 0.0

                result.insert(0, {
                    'symbol': symbol_upper,
                    'name': stock_name,
                    'price': price,
                    'currency': info.get("currency"),
                    'volume': info.get("volume", 0),
                    'change': round(change, 2),
                    'changePercent': round(change_percent, 2)
                })

                if not (df_symbols['symbol'] == symbol_upper).any():
                    df_symbols.loc[len(df_symbols)] = {'symbol': symbol_upper, 'name': stock_name}
                    df_symbols.to_csv(CSV_PATH, index=False)
        except Exception as e:
            print("DEBUG: Yahoo fetch failed or invalid symbol:", str(e))
            if not result:
                return JsonResponse({'error': 'Invalid stock symbol'}, status=400)

    if not result:
        print("WARNING: No results found.")
        return JsonResponse({'error': 'Invalid stock symbol'}, status=400)

    print("DEBUG: Returning", len(result), "entries.")
    return JsonResponse(result[:10], safe=False)

@api_view(['GET'])
@permission_classes([AllowAny])
def stock_quotes(request):
        symbols_param = request.GET.get('symbols', '')
        symbols = [sym.strip().upper() for sym in symbols_param.split(',') if sym.strip()]
 
        if not symbols:
            return Response({'error': 'No symbols provided'}, status=400)
 
        quotes = []
        for symbol in symbols:
            # Ensure .L suffix for LSE
            if not symbol.endswith('.L'):
                symbol += '.L'
 
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
 
                price = info.get("regularMarketPrice")
                prev_close = info.get("previousClose")
 
                if price is None or prev_close is None:
                    raise ValueError("Missing price or previous close")
 
                change = price - prev_close
                change_percent = (change / prev_close) * 100 if prev_close != 0 else 0.0
 
                quotes.append({
                    'symbol': symbol,
                    'regularMarketPrice': float(price),
                    'previousClose': float(prev_close),
                    'regularMarketChange': float(change),
                    'regularMarketChangePercent': float(change_percent),
                    'volume': info.get("volume", 0),
                    'marketCap': info.get("marketCap", 0),
                    'longName': info.get("longName") or '',
                    'shortName': info.get("shortName") or '',
                })
 
            except Exception as e:
                print(f"❌ Error fetching {symbol}: {e}")
                # Skip bad symbol instead of failing the whole response
                continue
 
        return Response({'success': True, 'quotes': quotes})

def get_json_data(request):
    try:
        return request.data
    except Exception as e:
        logger.error(f"Invalid JSON in request body: {e}", exc_info=True)
        return None


def get_symbol_from_csv(symbol_or_name):
    """Helper function to get symbol from CSV based on symbol or name"""
    try:
        df_symbols = pd.read_csv(CSV_PATH)
        df_symbols['symbol'] = df_symbols['symbol'].astype(str).str.upper()
        df_symbols['name'] = df_symbols['name'].astype(str).str.upper()
        
        search_term = symbol_or_name.upper().strip()
        logger.info(f"Searching for symbol: {search_term}")
        
        # First try exact symbol match
        symbol_match = df_symbols[df_symbols['symbol'] == search_term]
        if not symbol_match.empty:
            found_symbol = symbol_match.iloc[0]['symbol']
            logger.info(f"Found exact symbol match: {found_symbol}")
            return found_symbol
        
        # Then try exact name match
        name_match = df_symbols[df_symbols['name'] == search_term]
        if not name_match.empty:
            found_symbol = name_match.iloc[0]['symbol']
            logger.info(f"Found exact name match: {found_symbol}")
            return found_symbol
        
        # Finally try partial matches
        partial_symbol = df_symbols[df_symbols['symbol'].str.contains(search_term, na=False)]
        if not partial_symbol.empty:
            found_symbol = partial_symbol.iloc[0]['symbol']
            logger.info(f"Found partial symbol match: {found_symbol}")
            return found_symbol
        
        partial_name = df_symbols[df_symbols['name'].str.contains(search_term, na=False)]
        if not partial_name.empty:
            found_symbol = partial_name.iloc[0]['symbol']
            logger.info(f"Found partial name match: {found_symbol}")
            return found_symbol
        
        # If no match found in CSV, try the original symbol as-is
        logger.warning(f"No match found in CSV for {search_term}, returning original")
        return symbol_or_name.upper().strip()
        
    except Exception as e:
        logger.error(f"Error reading CSV: {e}")
        # Return original symbol if CSV fails
        return symbol_or_name.upper().strip()


def get_company_info_from_csv(symbol):
    """Helper function to get company name from CSV"""
    try:
        df_symbols = pd.read_csv(CSV_PATH)
        df_symbols['symbol'] = df_symbols['symbol'].astype(str).str.upper()
        
        match = df_symbols[df_symbols['symbol'] == symbol.upper()]
        if not match.empty:
            return match.iloc[0]['name']
        return None
    except Exception as e:
        logger.error(f"Error reading CSV: {e}")
        return None


# ✅ Search Tickers from CSV (autocomplete)
@api_view(['POST'])
@permission_classes([AllowAny])
def search_company_tickers(request):
    data = get_json_data(request)
    query = data.get('query', '').upper().strip()

    if not query:
        return Response([], status=200)

    try:
        df_symbols = pd.read_csv(CSV_PATH)
        df_symbols['symbol'] = df_symbols['symbol'].astype(str).str.upper()
        df_symbols['name'] = df_symbols['name'].astype(str).str.upper()
        
        matches = []
        for _, row in df_symbols.iterrows():
            symbol = str(row['symbol'])
            name = str(row['name'])
            if symbol.startswith(query):
                matches.append({"symbol": symbol, "name": name})
            if len(matches) >= 10:
                break
        
        return Response(matches, status=200)
    except Exception as e:
        logger.error(f"Error reading CSV: {e}")
        return Response({"message": "Ticker search data not available."}, status=500)

# ✅ Fetch Live Price for a Stock
@api_view(['POST'])
@permission_classes([AllowAny])
def get_live_stock_price_and_name(request):
    data = get_json_data(request)
    symbol = data.get('symbol', '').upper()

    if not symbol:
        return Response({'message': 'symbol is required'}, status=400)

    price, name = get_live_stock_data(symbol)

    if price is not None and name is not None:
        return Response({'symbol': symbol, 'name': name, 'price': price}, status=200)
    return Response({'message': f'Could not fetch live data for {symbol}'}, status=404)

# ✅ Fetch Detailed Stock Research Info (using symbol or name from CSV)
@api_view(['POST'])
@permission_classes([AllowAny])
def get_detailed_research_info(request):
    data = get_json_data(request)
    symbol = data.get('symbol', '').upper().strip()

    if not symbol:
        return Response({'message': 'Symbol is required'}, status=400)

    info = get_detailed_stock_info(symbol)
    if info:
        return Response(info, status=200)
    
    return Response({'message': f'Could not fetch detailed information for {symbol}'}, status=404)


# ✅ Historical Stock Prices (using symbol or name from CSV)
@api_view(['POST'])
@permission_classes([AllowAny])
def get_historical_stock_prices(request):
    data = get_json_data(request)
    symbol_or_name = data.get('symbol', '') or data.get('name', '')
    period = data.get('period', '1y')
    interval = data.get('interval', '1d')

    if not symbol_or_name:
        return Response({'message': 'Symbol or company name is required'}, status=400)

    # Get the actual symbol from CSV
    symbol = get_symbol_from_csv(symbol_or_name)
    if not symbol:
        return Response({'message': f'Could not find symbol for {symbol_or_name} in CSV'}, status=404)

    prices = get_historical_prices(symbol, period, interval)
    if prices:
        # Add CSV company name to the response
        csv_name = get_company_info_from_csv(symbol)
        if csv_name and isinstance(prices, dict):
            prices['csv_company_name'] = csv_name
        return Response(prices, status=200)
    return Response({'message': f'Could not fetch historical data for {symbol}'}, status=404)


# ✅ Updated Stock Info Lookup using CSV
@api_view(['GET'])
@permission_classes([AllowAny])
def get_stock_info_csv_lookup(request, symbol):
    try:
        df_symbols = pd.read_csv(CSV_PATH)
    except Exception as e:
        return JsonResponse({'error': f'CSV load error: {str(e)}'}, status=500)

    # Get the actual symbol from CSV
    actual_symbol = get_symbol_from_csv(symbol)
    
    if not actual_symbol:
        return JsonResponse({'error': f'Could not find symbol for {symbol} in CSV'}, status=404)

    try:
        stock = yf.Ticker(actual_symbol)
        info = stock.info
        csv_name = get_company_info_from_csv(actual_symbol)
        
        result = [{
            'symbol': actual_symbol,
            'name': csv_name if csv_name else info.get("shortName", actual_symbol),
            'csv_name': csv_name,
            'yf_name': info.get("shortName"),
            'price': info.get("regularMarketPrice"),
            'currency': info.get("currency")
        }]
        
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': f'Error fetching data for {actual_symbol}: {str(e)}'}, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_historical_stock_data(request, symbol):
    range = request.GET.get('range', '1mo')
    end_date = datetime.now()
    start_date = {
        '1wk': end_date - timedelta(weeks=1),
        '1mo': end_date - timedelta(days=30),
        '6mo': end_date - timedelta(days=180),
        '1y': end_date - timedelta(days=365),
    }.get(range, end_date - timedelta(days=30))

    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        name = info.get("shortName", "Unknown")
        sym = info.get("symbol", symbol)

        history = stock.history(start=start_date, end=end_date)

        if history.empty:
            return JsonResponse({'error': f'No historical data found for {symbol}'}, status=404)

        if not isinstance(history.index, pd.DatetimeIndex):
            history.index = pd.to_datetime(history.index)

        history = history.asfreq('D').ffill()

        df = history[['Close']].reset_index()
        df.rename(columns={'Close': 'price', 'Date': 'date'}, inplace=True)

        df=df[df['date'].dt.weekday < 5]

        if range == '1wk':
            df['date'] = df['date'].dt.strftime('%d %b %H:%M')
        elif range in ['1mo', '6mo', '1y']:
            df['date'] = df['date'].dt.strftime('%d %b %Y')

        return JsonResponse({
            'symbol': sym,
            'name': name,
            'data': df.to_dict(orient='records')
        }, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)