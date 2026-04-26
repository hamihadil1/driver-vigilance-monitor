from django.urls import path
from . import views

urlpatterns = [
    # المصادقة
    path('register', views.register_fullname),
    path('login', views.login_email),
    path('admin/login', views.admin_login),
    
    # الإنذارات
    path('alerts/save', views.save_alert),
    path('api/alerts/active', views.get_active_alerts),
    path('alerts/resolve/<int:alert_id>', views.resolve_alert),
    
    # السائقين
    path('api/drivers', views.get_drivers),
    
    # الصحة
    path('health', views.health),
]