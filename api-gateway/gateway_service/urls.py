from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib import admin
import requests
import json

def health_check(request):
    return JsonResponse({'service': 'api-gateway', 'status': 'ok'})

def forward_to_auth(request, endpoint):
    """توجيه الطلبات إلى Auth Service"""
    try:
        url = f"http://auth-service:8002/{endpoint}"
        if request.method == 'GET':
            resp = requests.get(url, params=request.GET)
        elif request.method == 'POST':
            resp = requests.post(url, json=json.loads(request.body) if request.body else {})
        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)
        
        return JsonResponse(resp.json(), status=resp.status_code, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=503)

@csrf_exempt
def forward_to_dl_api(request):
    try:
        # استخدم اسم الحاوية بدلاً من IP
        url = "http://dl-api:8000/api/predict/"
        
        if request.method == 'POST':
            if 'image' in request.FILES:
                resp = requests.post(url, files={'image': request.FILES['image']})
            else:
                resp = requests.post(url, data=request.POST, files=request.FILES)
        else:
            resp = requests.get(url)
        
        return JsonResponse(resp.json(), status=resp.status_code, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=503)
    
def driver_profile(request, email):
    return forward_to_auth(request, f"drivers/{email}/profile")

def driver_alerts(request, email):
    return forward_to_auth(request, f"drivers/{email}/alerts")

def driver_stats(request, email):
    return forward_to_auth(request, f"drivers/{email}/stats")

def all_drivers(request):
    return forward_to_auth(request, "drivers")

def active_alerts(request):
    return forward_to_auth(request, "alerts/active")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health', health_check),
    path('api/login', lambda r: forward_to_auth(r, 'login')),
    path('api/register', lambda r: forward_to_auth(r, 'register')),
    path('api/drivers', all_drivers),
    path('api/drivers/<str:email>/profile', driver_profile),
    path('api/drivers/<str:email>/alerts', driver_alerts),
    path('api/drivers/<str:email>/stats', driver_stats),
    path('api/alerts/active', active_alerts),
    path('api/predict', forward_to_dl_api),  # ← مسار التنبؤ
]