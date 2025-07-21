from datetime import datetime, time
import pytz

def is_lse_market_open():
    london_tz = pytz.timezone("Europe/London")
    now = datetime.now(london_tz)
    today = now.date()
    current_time = now.time()

    # Market hours (BST/GMT): 08:00 - 16:30
    market_open = time(8, 0)
    market_close = time(16, 30)

    # Weekend check
    if now.weekday() >= 5:
        return False

    # Add your own holiday list (or fetch dynamically later)
    lse_holidays = [
        datetime(2025, 1, 1).date(),  # New Year's Day
        datetime(2025, 12, 25).date(),  # Christmas
        datetime(2025, 12, 26).date(),  # Boxing Day
    ]

    if today in lse_holidays:
        return False

    return market_open <= current_time <= market_close
    
# Testing Purpose only
# def is_lse_market_open():
#     # Simulating market closed
#     print("⚠️ FORCING LSE MARKET TO BE CLOSED")
#     return False