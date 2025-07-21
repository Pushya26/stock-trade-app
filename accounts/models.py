from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
# -----------------------
# ✅ CustomUser Model
# -----------------------
class CustomUser(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('100000.00'))
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    def save(self, *args, **kwargs):
        if not self.pk and self.balance is None:
            self.balance = Decimal('10000.00')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

    @classmethod
    def get_default_balance(cls):
        """Get the default balance value"""
        return cls._meta.get_field('balance').default

    @classmethod
    def get_field_defaults(cls):
        """Get all default values for the model"""
        defaults = {}
        for field in cls._meta.get_fields():
            if hasattr(field, 'default') and field.default is not models.NOT_PROVIDED:
                defaults[f'{field.name}_default'] = field.default
        return defaults

    @classmethod
    def get_field_constraints(cls):
        """Get field constraints like max_length, max_digits, etc."""
        constraints = {}
        for field in cls._meta.get_fields():
            field_constraints = {}
            
            if hasattr(field, 'max_length') and field.max_length:
                field_constraints['max_length'] = field.max_length
            
            if hasattr(field, 'max_digits') and field.max_digits:
                field_constraints['max_digits'] = field.max_digits
                field_constraints['decimal_places'] = field.decimal_places
            
            if hasattr(field, 'choices') and field.choices:
                field_constraints['choices'] = field.choices
                
            if field_constraints:
                constraints[field.name] = field_constraints
                
        return constraints

    @classmethod
    def get_model_schema(cls):
        """Get complete model schema for frontend"""
        return {
            'defaults': cls.get_field_defaults(),
            'constraints': cls.get_field_constraints(),
            'required_fields': cls.REQUIRED_FIELDS,
            'username_field': cls.USERNAME_FIELD
        }

# -----------------------
# ✅ PendingUser Model
# -----------------------
class PendingUser(models.Model):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    password = models.CharField(max_length=128)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return self.email

# from django.contrib.auth.models import User  # or use get_user_model()
# from django.db import models
# from django.conf import settings

# class Watchlist(models.Model):
#     user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='watchlist')
#     symbols = models.JSONField(default=list)

#     def __str__(self):
#         return f"{self.user.email}'s Watchlist"