from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist')
    symbol = models.CharField(max_length=20, default='DEFAULT')
    created_at = models.DateTimeField(default=timezone.now)  # <- add this safely

    def __str__(self):
        return f"{self.user.username} - {self.symbol}"
