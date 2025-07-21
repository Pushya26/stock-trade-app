from django.urls import path
from .views import get_account_value_history

urlpatterns = [
    path('account-value-history/', get_account_value_history, name='account-value-history'),
]