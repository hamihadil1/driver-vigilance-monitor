from rest_framework import serializers
from .models import Conducteur, Alerte

class ConducteurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conducteur
        fields = '__all__'

class AlerteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerte
        fields = '__all__'
