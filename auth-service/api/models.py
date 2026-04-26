from django.db import models
from django.contrib.auth.models import User

class Conducteur(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='conducteur')
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, blank=True, null=True)
    route = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    join_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} {self.prenom}"
    
    @property
    def full_name(self):
        return f"{self.nom} {self.prenom}"


class Alerte(models.Model):
    ALERT_TYPES = [
        ('fatigue', 'Fatigue'),
        ('distraction', 'Distraction'),
        ('drowsiness', 'Drowsiness'),
    ]
    
    conducteur = models.ForeignKey(Conducteur, on_delete=models.CASCADE, null=True, blank=True, related_name='alertes')
    driver_id = models.CharField(max_length=100, blank=True, null=True)
    driver_name = models.CharField(max_length=200, blank=True, null=True)
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES, default='fatigue')
    confidence = models.IntegerField(default=0, help_text="Confidence percentage (0-100)")
    timestamp = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.driver_name or self.conducteur} - {self.alert_type} at {self.timestamp}"