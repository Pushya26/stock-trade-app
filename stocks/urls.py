from django.urls import path
from .views import (
    get_stock_info,
    stock_quotes,
    get_live_stock_price_and_name,
    get_detailed_research_info,
    get_historical_stock_prices,
    get_historical_stock_data,         # for chart with symbol param
    search_company_tickers,
    get_stock_info_csv_lookup,         # new CSV + fallback view
    market_status
)


urlpatterns = [
    # path('stocks/search-tickers', search_company_tickers, name='search_company_tickers'),
    path('stocks/<str:symbol>/', get_stock_info, name='get_stock_info'),
    path('market-status/', market_status),
    path('quotes/',stock_quotes),
     # 🔍 Search & Lookup
    path('stocks/search-tickers', search_company_tickers, name='search_company_tickers'),
    path('stocks/<str:symbol>/', get_stock_info_csv_lookup, name='get_stock_info_csv_lookup'),

    # 📈 Live & Research Info
    path('stocks/live-price', get_live_stock_price_and_name, name='live_stock_price_and_name'),
    path('stocks/research-info', get_detailed_research_info, name='detailed_research_info'),

    # 📉 Historical Price APIs
    path('stocks/historical-prices', get_historical_stock_prices, name='historical_stock_prices'),  # POST with ticker, period, interval
    path('historical/<str:symbol>/', get_historical_stock_data, name='get_historical_stock_data'),  # GET with range param for chart

]