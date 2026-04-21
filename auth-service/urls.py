from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

# قاعدة بيانات مؤقتة (سيتم استبدالها بـ SQLite لاحقاً)
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
                'role': 'driver'  # كل المستخدمين الجدد هم Drivers
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
            
            if email not in users or users[email]['password'] != password:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
            user = users[email]
            return JsonResponse({
                'message': 'Login successful', 
                'access': 'fake-jwt-token',
                'role': user.get('role', 'driver'),
                'userId': email,
                'name': user.get('fullname', email),
                'email': email
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Admin login (مستخدم خاص للمدير)
@csrf_exempt
def admin_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            
            # Admin محدد مسبقاً
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

urlpatterns = [
    path('health', health_check),
    path('register', register),
    path('login', login),
    path('admin/login', admin_login),
    path('admin/', admin.site.urls),
]