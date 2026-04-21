from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Conducteur, Alerte
from .serializers import ConducteurSerializer, AlerteSerializer

User = get_user_model()

# ====================== Health Check ======================
@api_view(['GET'])
def health(request):
    return Response({'service': 'auth-service', 'status': 'ok'})

# ====================== Login with email ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def login_email(request):
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'error': 'email and password required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=401)
    
    if not user.check_password(password):
        return Response({'error': 'Invalid credentials'}, status=401)
    
    # Déterminer le rôle
    if user.is_superuser or user.is_staff:
        role = 'admin'
    else:
        role = 'driver'
    
    return Response({
        'message': 'Login successful',
        'access': 'fake-jwt-token',
        'role': role,
        'userId': user.id,
        'name': user.username,
        'email': user.email
    })

# ====================== Registration with fullname and phone ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def register_fullname(request):
    fullname = request.data.get('fullname')
    email = request.data.get('email')
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')
    phone = request.data.get('phone', '')
    
    if not all([fullname, email, password, confirm_password]):
        return Response({'error': 'All fields are required'}, status=400)
    
    if password != confirm_password:
        return Response({'error': 'Passwords do not match'}, status=400)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered'}, status=400)
    
    user = User.objects.create_user(username=email, email=email, password=password)
    
    name_parts = fullname.split(' ', 1)
    nom = name_parts[0] if name_parts else ''
    prenom = name_parts[1] if len(name_parts) > 1 else ''
    Conducteur.objects.create(user=user, nom=nom, prenom=prenom, phone=phone)
    
    return Response({'message': 'User created successfully', 'user_id': user.id})

# ====================== Password Reset (placeholder) ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'email required'}, status=400)
    return Response({'message': 'Password reset link sent (if email exists)'})

# ====================== CRUD for Conducteur ======================
class ConducteurViewSet(viewsets.ModelViewSet):
    queryset = Conducteur.objects.all()
    serializer_class = ConducteurSerializer
    permission_classes = [IsAuthenticated]

# ====================== CRUD for Alerte ======================
class AlerteViewSet(viewsets.ModelViewSet):
    queryset = Alerte.objects.all()
    serializer_class = AlerteSerializer
    permission_classes = [IsAuthenticated]