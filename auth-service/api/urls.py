from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conducteurs', views.ConducteurViewSet)
router.register(r'alertes', views.AlerteViewSet)

urlpatterns = [
    path('health', views.health),
    path('register', views.register),
    path('', include(router.urls)),
]
