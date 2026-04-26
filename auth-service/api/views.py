from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, status
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Conducteur, Alerte
from .serializers import ConducteurSerializer, AlerteSerializer
import json

User = get_user_model()

# ====================== Health Check ======================
@api_view(['GET'])
def health(request):
    return Response({'service': 'auth-service', 'status': 'ok'})


# ====================== Save Alert from DriverDashboard ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def save_alert(request):
    """حفظ إنذار جديد من DriverDashboard"""
    try:
        data = request.data
        print(f"📥 Received alert: {data}")  # للتصحيح
        
        driver_id = data.get('driver_id')
        driver_name = data.get('driver_name', 'Unknown')
        alert_type = data.get('alert_type', 'fatigue')
        confidence = data.get('confidence', 0)
        
        # محاولة العثور على السائق في قاعدة البيانات
        conducteur = None
        if driver_id:
            try:
                # إذا كان driver_id رقماً
                if str(driver_id).isdigit():
                    conducteur = Conducteur.objects.filter(id=int(driver_id)).first()
                else:
                    # محاولة البحث بالبريد الإلكتروني
                    user = User.objects.filter(email=driver_id).first()
                    if user:
                        conducteur = Conducteur.objects.filter(user=user).first()
            except Exception as e:
                print(f"Error finding driver: {e}")
        
        # إنشاء الإنذار
        alert = Alerte.objects.create(
            conducteur=conducteur,
            driver_id=str(driver_id) if driver_id else None,
            driver_name=driver_name,
            alert_type=alert_type,
            confidence=confidence,
            is_active=True,
            is_read=False
        )
        
        print(f"✅ Alert saved with ID: {alert.id}")
        
        return Response({
            'status': 'success',
            'alert_id': alert.id,
            'message': 'Alert saved successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Error saving alert: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ====================== Get Active Alerts for Admin ======================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_alerts(request):
    """جلب الإنذارات النشطة للمسؤول"""
    try:
        alerts = Alerte.objects.filter(is_active=True, is_read=False).order_by('-timestamp')
        
        data = []
        for alert in alerts:
            # الحصول على اسم السائق
            if alert.conducteur:
                driver_name = alert.conducteur.full_name
                driver_id_display = alert.conducteur.id
            else:
                driver_name = alert.driver_name or "Unknown"
                driver_id_display = alert.driver_id
            
            data.append({
                'id': alert.id,
                'name': driver_name,
                'driver_id': driver_id_display,
                'time': alert.timestamp.strftime('%H:%M'),
                'confidence': alert.confidence,
                'timestamp': alert.timestamp.isoformat(),
                'type': alert.alert_type
            })
        
        return Response(data)
        
    except Exception as e:
        print(f"❌ Error fetching alerts: {e}")
        return Response([], status=status.HTTP_200_OK)


# ====================== Mark Alert as Read ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def resolve_alert(request, alert_id):
    """تحديد إنذار كمقروء"""
    try:
        alert = Alerte.objects.get(id=alert_id)
        alert.is_read = True
        alert.is_active = False
        alert.save()
        return Response({'status': 'success', 'message': 'Alert resolved'})
    except Alerte.DoesNotExist:
        return Response({'status': 'error', 'message': 'Alert not found'}, status=404)


# ====================== Get All Drivers for Admin ======================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_drivers(request):
    """جلب جميع السائقين للمسؤول"""
    try:
        conducteurs = Conducteur.objects.select_related('user').all()
        data = []
        for c in conducteurs:
            data.append({
                'id': c.id,
                'name': c.full_name,
                'email': c.user.email if c.user else None,
                'phone': c.phone,
                'route': c.route or "Highway 101 - Northbound",
                'status': 'active' if c.is_active else 'inactive',
                'joinDate': c.join_date.strftime('%b %Y') if c.join_date else "Jan 2025"
            })
        return Response(data)
    except Exception as e:
        print(f"Error getting drivers: {e}")
        return Response([], status=status.HTTP_200_OK)


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
    
    # توليد JWT token
    refresh = RefreshToken.for_user(user)
    
    # تحديد الدور
    if user.is_superuser or user.is_staff:
        role = 'admin'
    else:
        role = 'driver'
    
    return Response({
        'message': 'Login successful',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'role': role,
        'userId': user.id,
        'name': user.username,
        'email': user.email
    })


# ====================== Registration ======================
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
    
    # إنشاء المستخدم
    user = User.objects.create_user(username=email, email=email, password=password)
    
    # تقسيم الاسم الكامل
    name_parts = fullname.split(' ', 1)
    nom = name_parts[0] if name_parts else ''
    prenom = name_parts[1] if len(name_parts) > 1 else ''
    
    # إنشاء سجل السائق
    Conducteur.objects.create(user=user, nom=nom, prenom=prenom, phone=phone, is_active=True)
    
    return Response({'message': 'User created successfully', 'user_id': user.id})


# ====================== Admin Login ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Admin محدد مسبقاً (يمكنك إنشاؤه في قاعدة البيانات)
    if email == 'admin@test.com' and password == 'admin123':
        return Response({
            'message': 'Login successful',
            'access': 'admin-fake-token',
            'role': 'admin',
            'userId': 'admin',
            'name': 'Administrator',
            'email': email
        })
    
    return Response({'error': 'Invalid credentials'}, status=401)