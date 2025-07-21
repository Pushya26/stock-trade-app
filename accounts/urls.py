from django.urls import path
from . import views
from .views import forgot_password_request, reset_password
from rest_framework_simplejwt.views import TokenObtainPairView
# from .views import WatchlistView

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('verify-register-otp/', views.verify_otp, name='verify_otp'),
    path('login/', views.login_user, name='login_user'),
    path('forgot-password/', forgot_password_request),
    path('reset-password/', reset_password),
    path('user/cash/', views.get_default_balance, name='get_default_balance'),
    path('resend-register-otp/', views.resend_register_otp, name='resend_register_otp'),
    path('user/profile/', views.user_profile_full, name='user_profile'),
    path('change-password/', views.change_password, name='change_password'),
    # path('user/cash/', views.get_user_cash, name='get_user_cash'),
    # path('watchlist/', views.get_watchlist),
    # path('watchlist/add/', views.add_to_watchlist),
    # path('watchlist/remove/', views.remove_from_watchlist),
    # path('watchlist/', WatchlistView.as_view(), name='user-watchlist'),
]
