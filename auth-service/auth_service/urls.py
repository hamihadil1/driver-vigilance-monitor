from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from api import views

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
            
            from django.contrib.auth import authenticate
            from django.contrib.auth.models import User
            
            # البحث عن المستخدم في قاعدة البيانات
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
            # التحقق من كلمة المرور
            if not user.check_password(password):
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
            # تحديد الدور
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
    """الحصول على ملف تعريف السائق من قاعدة البيانات"""
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
    """الحصول على تنبيهات السائق"""
    return JsonResponse([
        {'id': 1, 'date': 'Today', 'time': '14:30', 'type': 'fatigue'},
        {'id': 2, 'date': 'Yesterday', 'time': '09:15', 'type': 'fatigue'}
    ], safe=False)

def get_driver_stats(request, email):
    """الحصول على إحصائيات السائق"""
    return JsonResponse({
        'today': 0,
        'weeklyTotal': 3,
        'weekly': [
            {'day': 'Mon', 'alerts': 0},
            {'day': 'Tue', 'alerts': 1},
            {'day': 'Wed', 'alerts': 0},
            {'day': 'Thu', 'alerts': 2},
            {'day': 'Fri', 'alerts': 0},
            {'day': 'Sat', 'alerts': 0},
            {'day': 'Sun', 'alerts': 0}
        ]
    })

def get_all_drivers(request):
    """الحصول على جميع السائقين"""
    drivers_list = []
    for email, data in users.items():
        drivers_list.append({
            'id': email,
            'name': data.get('fullname', email),
            'email': email,
            'phone': data.get('phone', ''),
            'role': data.get('role', 'driver'),
            'status': 'active',
            'joinDate': 'Apr 2026'
        })
    return JsonResponse(drivers_list, safe=False)

def get_active_alerts(request):
    """الحصول على التنبيهات النشطة"""
    return JsonResponse([], safe=False)

@csrf_exempt
def save_alert(request):
    """حفظ إنذار جديد"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print(f"📥 Received alert: {data}")
            return JsonResponse({
                'status': 'success', 
                'alert_id': 1, 
                'message': 'Alert saved'
            }, status=201)
        except Exception as e:
            print(f"❌ Error: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

urlpatterns = [
    path('health', health_check),
    path('register', register),
    path('login', login),
    path('admin/login', admin_login),
    path('admin/', admin.site.urls),

     # مسارات API للسائقين
    path('drivers', get_all_drivers),
    path('drivers/<str:email>/profile', get_driver_profile),
    path('drivers/<str:email>/alerts', get_driver_alerts),
    path('drivers/<str:email>/stats', get_driver_stats),
    path('alerts/active', get_active_alerts),

    path('alerts/save', save_alert),
]