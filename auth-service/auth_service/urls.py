from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

users = {}

def health_check(request):
    return JsonResponse({'status': 'ok', 'service': 'auth-service'})

@csrf_exempt
def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            fullname = data.get('fullname')
            phone = data.get('phone', '')
            
            if not email or not password:
                return JsonResponse({'error': 'Email and password required'}, status=400)
            
            if email in users:
                return JsonResponse({'error': 'User already exists'}, status=400)
            
            users[email] = {
                'password': password,
                'fullname': fullname,
                'phone': phone,
                'role': 'driver'
            }
            return JsonResponse({'message': 'User created successfully', 'user_id': email, 'role': 'driver'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            
            from django.contrib.auth.models import User
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
            if not user.check_password(password):
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
            if user.is_superuser or user.is_staff:
                role = 'admin'
            else:
                role = 'driver'
            
            return JsonResponse({
                'message': 'Login successful',
                'access': 'fake-jwt-token',
                'role': role,
                'userId': user.id,
                'name': user.username,
                'email': user.email
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def admin_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            
            if email == 'admin@test.com' and password == 'admin123':
                return JsonResponse({
                    'message': 'Login successful',
                    'access': 'fake-jwt-token-admin',
                    'role': 'admin',
                    'userId': 'admin',
                    'name': 'Administrator',
                    'email': email
                })
            
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def get_driver_profile(request, email):
    from django.contrib.auth.models import User
    try:
        user = User.objects.get(email=email)
        return JsonResponse({
            'id': user.email,
            'name': user.username,
            'email': user.email,
            'phone': '0555123456',
            'role': 'admin' if user.is_superuser else 'driver',
            'status': 'active',
            'joinDate': 'Apr 2026'
        })
    except User.DoesNotExist:
        return JsonResponse({'error': 'Driver not found'}, status=404)

def get_driver_alerts(request, email):
    from api.models import Alerte
    try:
        alerts = Alerte.objects.filter(driver_id=email).order_by('-timestamp')
        data = [{
            'id': a.id,
            'date': 'Today',
            'time': a.timestamp.strftime('%H:%M:%S'),
            'type': a.alert_type,
            'confidence': a.confidence
        } for a in alerts[:20]]
        return JsonResponse(data, safe=False)
    except:
        return JsonResponse([], safe=False)

def get_driver_stats(request, email):
    from api.models import Alerte
    from django.utils import timezone
    from datetime import timedelta
    
    today = timezone.now().date()
    alerts_today = Alerte.objects.filter(
        driver_id=email,
        timestamp__date=today
    ).count()
    
    weekly_alerts = Alerte.objects.filter(
        driver_id=email,
        timestamp__date__gte=today - timedelta(days=7)
    ).count()
    
    return JsonResponse({
        'today': alerts_today,
        'weeklyTotal': weekly_alerts,
        'weekly': []
    })

def get_all_drivers(request):
    from django.contrib.auth.models import User
    from api.models import Conducteur
    
    drivers_list = []
    for user in User.objects.filter(is_superuser=False, is_staff=False):
        conducteur = Conducteur.objects.filter(user=user).first()
        drivers_list.append({
            'id': user.id,
            'name': conducteur.full_name if conducteur else user.username,
            'email': user.email,
            'phone': conducteur.phone if conducteur else '',
            'role': 'driver',
            'status': 'active',
            'joinDate': user.date_joined.strftime('%b %Y') if user.date_joined else 'Apr 2026'
        })
    return JsonResponse(drivers_list, safe=False)

def get_active_alerts(request):
    from api.models import Alerte
    alerts = Alerte.objects.filter(is_active=True, is_read=False).order_by('-timestamp')
    
    data = []
    for alert in alerts:
        name = alert.driver_name
        if not name and alert.conducteur:
            name = f"{alert.conducteur.nom} {alert.conducteur.prenom}"
        
        data.append({
            'id': alert.id,
            'name': name or 'Unknown',
            'time': alert.timestamp.strftime('%H:%M:%S'),
            'confidence': alert.confidence,
            'timestamp': alert.timestamp.isoformat()
        })
    
    return JsonResponse(data, safe=False)

@csrf_exempt
def save_alert(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print(f"📥 Received alert: {data}")
            
            from api.models import Alerte
            alert = Alerte.objects.create(
                driver_name=data.get('driver_name', 'Unknown'),
                driver_id=data.get('driver_id'),
                alert_type=data.get('alert_type', 'fatigue'),
                confidence=data.get('confidence', 0),
                is_active=True,
                is_read=False
            )
            
            print(f"✅ Alert saved in database with ID: {alert.id}")
            
            return JsonResponse({
                'status': 'success',
                'alert_id': alert.id,
                'message': 'Alert saved in database'
            }, status=201)
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

urlpatterns = [
    path('health', health_check),
    path('register', register),
    path('login', login),
    path('admin/login', admin_login),
    path('admin/', admin.site.urls),
    path('drivers', get_all_drivers),
    path('drivers/<str:email>/profile', get_driver_profile),
    path('drivers/<str:email>/alerts', get_driver_alerts),
    path('drivers/<str:email>/stats', get_driver_stats),
    path('alerts/active', get_active_alerts),
    path('alerts/save', save_alert),
]