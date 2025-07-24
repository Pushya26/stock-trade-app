# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TradeViewSet, fresh_market_news, top_movers, company_news, top_movers_news, paginated_company_news, cached_news, get_bulk_rss_articles

router = DefaultRouter()
router.register(r'trade', TradeViewSet, basename='trade')

urlpatterns = [
    path('v1/trading/fresh-news/', fresh_market_news, name='fresh_market_news'),
    path('v1/trading/top-movers/', top_movers, name='top_movers'),
    path('v1/trading/company-news/<str:symbol>/', company_news, name='company_news'),
    path('v1/trading/top-movers-news/', top_movers_news, name='top_movers_news'),
    path('v1/trading/paginated-company-news/', paginated_company_news, name='paginated_company_news'),
    path('v1/trading/cached-news/', cached_news, name='cached_news'),
    path('api/bulk-rss-articles/', get_bulk_rss_articles, name='bulk_rss_articles'),
    path('', include(router.urls)),
]
