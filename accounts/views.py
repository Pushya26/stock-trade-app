from rest_framework.decorators import api_view,permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password
import random
from .models import PendingUser
# from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
User = get_user_model()
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser
from django.utils import timezone
from .serializers import ProfileSerializer
from rest_framework.permissions import IsAuthenticated


# -------------------------
# ✅ Registration Endpoint
# -------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('firstName')
    last_name = request.data.get('lastName')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)

    if User.objects.filter(username=email).exists():
        return Response({'error': 'Email is already registered'}, status=400)

    otp = str(random.randint(100000, 999999))
    hashed_password = make_password(password)

    PendingUser.objects.update_or_create(
        email=email,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'password': hashed_password,
            'otp': otp,
        }
    )

    send_mail(
        'Your OTP for EducateTrade',
        f'Your verification code is {otp}',
        'no-reply@educatetrade.com',
        [email],
        fail_silently=False,
    )

    return Response({'message': 'OTP sent to your email'}, status=200)
    

# -------------------------
# ✅ Verify OTP
# -------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp_input = request.data.get('otp')

    try:
        pending_user = PendingUser.objects.get(email=email)

        if pending_user.otp != otp_input:
            return Response({'error': 'Invalid OTP'}, status=400)

        if pending_user.is_expired():
            pending_user.delete()
            return Response({'error': 'OTP expired'}, status=400)
        default_balance = CustomUser.get_default_balance()
        user = User.objects.create_user(
            username=email,
            email=email,
            password=None,  # we'll assign hashed password manually
        )
        user.password = pending_user.password  # already hashed
        user.first_name = pending_user.first_name
        user.last_name = pending_user.last_name
        user.balance =100000.00
        user.save()

        pending_user.delete()

        return Response({'message': 'Registration successful'}, status=201)

    except PendingUser.DoesNotExist:
        return Response({'error': 'No pending registration found'}, status=404)

# -------------------------
# ✅ Login
# -------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    print("login is started")
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(username=email, password=password)

    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key})
    else:
        return Response({"error": "Invalid credentials"}, status=400)

    if user is not None:
        return Response({'message': 'Login successful'}, status=200)
    else:
        return Response({'error': 'Invalid credentials'}, status=401)

# -------------------------
# ✅ Forgot Password - Send OTP
# -------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_request(request):
    email = request.data.get('email')

    if not email:
        return Response({'error': 'Email is required'}, status=400)

    try:
        user = User.objects.get(username=email)
    except User.DoesNotExist:
        return Response({'error': 'No user found with this email'}, status=404)

    otp = str(random.randint(100000, 999999))

    PendingUser.objects.update_or_create(
        email=email,
        defaults={
            'otp': otp,
            'password': '',  # no password at this stage
        }
    )

    send_mail(
        'EducateTrade Password Reset OTP',
        f'Your password reset code is: {otp}',
        'no-reply@educatetrade.com',
        [email],
        fail_silently=False
    )

    return Response({'message': 'OTP sent to your email for password reset'}, status=200)

# -------------------------
# ✅ Reset Password
# -------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get('email')
    otp_input = request.data.get('otp')
    new_password = request.data.get('new_password')

    if not email or not otp_input or not new_password:
        return Response({'error': 'Email, OTP, and new password are required'}, status=400)

    try:
        pending_user = PendingUser.objects.get(email=email)

        if pending_user.otp != otp_input:
            return Response({'error': 'Invalid OTP'}, status=400)

        if pending_user.is_expired():
            pending_user.delete()
            return Response({'error': 'OTP expired'}, status=400)

        user = User.objects.get(username=email)
        user.password = make_password(new_password)
        user.save()

        pending_user.delete()

        return Response({'message': 'Password reset successful'}, status=200)

    except PendingUser.DoesNotExist:
        return Response({'error': 'No pending reset request found'}, status=404)

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

@api_view(['GET'])
def get_user_model_schema(request):
    """Get complete user model schema"""
    try:
        schema = CustomUser.get_model_schema()
        return Response(schema, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_default_balance(request):
    """Get just the default balance"""
    try:
        default_balance = CustomUser.get_default_balance()
        return Response({
            'default_balance': float(default_balance)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_cash(request):
    return Response({'balance': float(request.user.balance)})

# -------------------------
# ✅ Resend Registration OTP
# -------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def resend_register_otp(request):
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    
    try:
        # Check if there's a pending registration for this email
        pending_user = PendingUser.objects.get(email=email)
        
        # Generate new OTP
        otp = str(random.randint(100000, 999999))
        
        # Update the existing pending user with new OTP
        pending_user.otp = otp
        pending_user.created_at = timezone.now()  # Reset the timer
        pending_user.save()
        
        # Send the new OTP
        send_mail(
            'Your New OTP for EducateTrade',
            f'Your new verification code is {otp}',
            'no-reply@educatetrade.com',
            [email],
            fail_silently=False,
        )
        
        return Response({'message': 'New OTP sent to your email'}, status=200)
        
    except PendingUser.DoesNotExist:
        return Response({'error': 'No pending registration found for this email'}, status=404)

@api_view(['POST'])
def change_password(request):
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
 
    if not current_password or not new_password or not confirm_password:
        return Response({'error': 'All fields are required'}, status=400)
 
    if new_password != confirm_password:
        return Response({'error': 'New passwords do not match'}, status=400)
 
    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=400)
 
    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password changed successfully'}, status=200)
 
@api_view(['GET', 'PUT'])
def user_profile_full(request):
    if request.method == 'GET':
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
@api_view(['GET'])
def user_profile(request):
    user = request.user
    return Response({
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email
    })


# from .models import Watchlist
# from .serializers import WatchlistSerializer

# @api_view(['GET'])

# def get_watchlist(request):
#     items = Watchlist.objects.filter(user=request.user)
#     serializer = WatchlistSerializer(items, many=True)
#     return Response(serializer.data)

# @api_view(['POST'])
# def add_to_watchlist(request):
#     symbol = request.data.get('symbol')
#     if not symbol:
#         return Response({'error': 'Symbol is required'}, status=400)
#     Watchlist.objects.get_or_create(user=request.user, symbol=symbol)
#     return Response({'message': 'Added'})

# @api_view(['DELETE'])
# def remove_from_watchlist(request):
#     symbol = request.data.get('symbol')
#     Watchlist.objects.filter(user=request.user, symbol=symbol).delete()
#     return Response({'message': 'Removed'})

# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from rest_framework import status
# from .models import Watchlist
# from .serializers import WatchlistSerializer

# class WatchlistView(APIView):
   
#     @permission_classes([AllowAny])
#     def get(self, request):
#         watchlist, created = Watchlist.objects.get_or_create(user=request.user)
#         serializer = WatchlistSerializer(watchlist)
#         return Response(serializer.data)

#     @permission_classes([AllowAny])
#     def post(self, request):
#         symbols = request.data.get('symbols', [])
#         if not isinstance(symbols, list):
#             return Response({'error': 'symbols must be a list'}, status=status.HTTP_400_BAD_REQUEST)

#         watchlist, created = Watchlist.objects.get_or_create(user=request.user)
#         watchlist.symbols = symbols
#         watchlist.save()
#         return Response({'message': 'Watchlist updated', 'symbols': watchlist.symbols})