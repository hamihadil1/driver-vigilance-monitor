from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets
from django.contrib.auth.models import User
from .models import Conducteur, Alerte
from .serializers import ConducteurSerializer, AlerteSerializer

@api_view(['GET'])
def health(request):
    return Response({'service': 'auth-service', 'status': 'ok'})

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')

    if not username or not password:
        return Response({'error': 'username and password required'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    return Response({'message': 'User created successfully', 'user_id': user.id})

class ConducteurViewSet(viewsets.ModelViewSet):
    queryset = Conducteur.objects.all()
    serializer_class = ConducteurSerializer
    permission_classes = [IsAuthenticated]

class AlerteViewSet(viewsets.ModelViewSet):
    queryset = Alerte.objects.all()
    serializer_class = AlerteSerializer
    permission_classes = [IsAuthenticated]
