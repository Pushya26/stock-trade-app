from datetime import datetime, timedelta
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from decimal import Decimal
import yfinance as yf
from trade_engine.models import Portfolio, Transaction, Stock
 
def is_trading_day(date):
    return date.weekday() < 5
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_account_value_history(request):
    try:
        user = request.user
        timeframe = request.GET.get('timeframe', '1M')
 
        first_transaction = Transaction.objects.filter(user=user).order_by('timestamp').first()
        if not first_transaction:
            return JsonResponse({'data': [{
                'date': datetime.now().strftime('%d %b'),
                'total_value': 10000.00
            }]}, safe=False)
 
        start_date = first_transaction.timestamp.date()
        end_date = datetime.now().date()
 
        timeframe_start = end_date - timedelta(days={
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '6M': 180,
            '1Y': 365
        }.get(timeframe, 30))
 
        start_date = max(start_date, timeframe_start)
 
        data = []
        current_date = start_date
 
        if is_trading_day(start_date):
            data.append({
                'date': start_date.strftime('%d %b'),
                'total_value': 10000.00
            })
 
        days_since_last_point = 0
        should_add_point = True
       
        current_date = start_date + timedelta(days=1)
 
        while current_date <= end_date:
            if is_trading_day(current_date):
                if timeframe in ['3M', '6M']:
                    should_add_point = days_since_last_point >= 15
                    if should_add_point:
                        days_since_last_point = 0
                    else:
                        days_since_last_point += 1
               
                if should_add_point:
                    holdings = Portfolio.objects.filter(user=user)
                    account_value = Decimal('0')
 
                    for p in holdings:
                        symbol = p.stock.symbol
                        quantity = p.quantity
 
                        buy_transactions = Transaction.objects.filter(
                            user=user,
                            sstock=p.stock,
                            transaction_type='BUY',
                            timestamp__date__lte=current_date
                        )
                       
                        total_quantity = sum(t.quantity for t in buy_transactions)
                        total_spent = sum(t.quantity * t.price for t in buy_transactions)
                        buy_price = total_spent / total_quantity if total_quantity > 0 else Decimal('0')
                       
                        invested = quantity * buy_price
                        account_value += invested
 
                    data.append({
                        'date': current_date.strftime('%d %b'),
                        'total_value': float(account_value)
                    })
 
            current_date += timedelta(days=1)
 
        if timeframe != '1W' and (end_date - start_date).days < 8:
            start_date = end_date - timedelta(days=7)
            data = []
            current_date = start_date
           
            while current_date <= end_date:
                if is_trading_day(current_date):
                    holdings = Portfolio.objects.filter(user=user)
                    account_value = Decimal('0')
                   
                    for p in holdings:
                        symbol = p.stock.symbol
                        quantity = p.quantity
                        buy_transactions = Transaction.objects.filter(
                            user=user,
                            sstock=p.stock,
                            transaction_type='BUY',
                            timestamp__date__lte=current_date
                        )
                        total_quantity = sum(t.quantity for t in buy_transactions)
                        total_spent = sum(t.quantity * t.price for t in buy_transactions)
                        buy_price = total_spent / total_quantity if total_quantity > 0 else Decimal('0')
                        invested = quantity * buy_price
                        account_value += invested
 
                    data.append({
                        'date': current_date.strftime('%d %b'),
                        'total_value': float(account_value)
                    })
 
                current_date += timedelta(days=1)
 
        return JsonResponse({'data': data}, safe=False)
 
    except Exception as e:
        print(f"Error in get_account_value_history: {str(e)}")
        return JsonResponse({
            'error': 'Internal server error',
            'details': str(e)
        }, status=500)
 
 