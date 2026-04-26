import os
import sys

# إعداد Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_service.settings')
sys.path.insert(0, '/app')

import django
django.setup()

from django.contrib.auth.models import User
from api.models import Conducteur

# إنشاء Admin
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@test.com', 'admin123')
    print('✅ Admin user created')
else:
    print('⚠️ Admin already exists')

# إنشاء سائق 1
if not User.objects.filter(username='driver1').exists():
    u1 = User.objects.create_user('driver1', 'driver1@test.com', 'driver123')
    Conducteur.objects.create(user=u1, nom='Test', prenom='Driver1', phone='0555123456')
    print('✅ Driver1 created')
else:
    print('⚠️ Driver1 already exists')

# إنشاء سائق 2
if not User.objects.filter(username='driver2').exists():
    u2 = User.objects.create_user('driver2', 'driver2@test.com', 'driver123')
    Conducteur.objects.create(user=u2, nom='Test', prenom='Driver2', phone='0555789012')
    print('✅ Driver2 created')
else:
    print('⚠️ Driver2 already exists')

# عرض المستخدمين
print('\n📋 Users:')
for u in User.objects.all():
    print(f'  - {u.username}: {u.email} (superuser: {u.is_superuser})')