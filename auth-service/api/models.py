from django.db import models
from django.contrib.auth.models import User

class Conducteur(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    permis = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.nom} {self.prenom}"

class Alerte(models.Model):
    conducteur = models.ForeignKey(Conducteur, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=20)  # 'drowsy' or 'distracted'
    lu = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.conducteur} - {self.type} at {self.timestamp}"