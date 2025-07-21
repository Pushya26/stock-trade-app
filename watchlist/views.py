from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from .models import Watchlist
from .serializers import WatchlistSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class WatchlistViewSet(viewsets.ModelViewSet):
    serializer_class = WatchlistSerializer
    # permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        symbol = request.data.get('symbol')
        if not symbol:
            return Response({'detail': 'Symbol is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent duplicates
        if Watchlist.objects.filter(user=request.user, symbol=symbol).exists():
            return Response({'detail': 'Stock already in watchlist.'}, status=status.HTTP_400_BAD_REQUEST)

        watch = Watchlist.objects.create(user=request.user, symbol=symbol)
        serializer = self.get_serializer(watch)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['delete'], url_path='remove')
    def remove_by_symbol(self, request):
        symbol = request.query_params.get('symbol')
        if not symbol:
            return Response({'error': 'Symbol is required as a query param'}, status=status.HTTP_400_BAD_REQUEST)
 
        print("Inside remove_by_symbol route")
 
        try:
            watch = Watchlist.objects.get(user=request.user, symbol=symbol)
            print("Found and deleting:", watch)
            watch.delete()
            return Response({'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Watchlist.DoesNotExist:
            return Response({'error': 'Watchlist item not found'}, status=status.HTTP_404_NOT_FOUND)