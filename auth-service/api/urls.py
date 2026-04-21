from django.urls import path
from . import views

urlpatterns = [
    path('register', views.register_fullname),
    path('login', views.login_email),
    path('password-reset', views.password_reset_request),
]