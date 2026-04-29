from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from PIL import Image
import io
import base64
import urllib.request
import time
import pika
import json

from dl_model.predict import model_instance

# ============================================
# إعدادات عالية التحمل (85% عتبة)
# ============================================
CONFIDENCE_THRESHOLD = 81.0        # 85% عتبة عالية
WARNING_THRESHOLD = 5              # 6 إطارات (~3 ثواني) تحذير
ALERT_THRESHOLD = 10               # 12 إطاراً (~6 ثواني) إنذار
ALERT_COOLDOWN = 20                # 25 ثانية بين الإنذارات

RABBITMQ_HOST = 'rabbitmq'
RABBITMQ_QUEUE = 'fatigue_alerts'

consecutive_fatigue_count = 0
last_alert_time = 0

def send_alert_to_rabbitmq(driver_id, confidence):
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST)
        )
        channel = connection.channel()
        channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)
        message = {
            'type': 'fatigue_alert',
            'driver_id': driver_id,
            'confidence': confidence,
            'timestamp': time.time(),
            'status': 'critical'
        }
        channel.basic_publish(
            exchange='',
            routing_key=RABBITMQ_QUEUE,
            body=json.dumps(message),
            properties=pika.BasicProperties(delivery_mode=2)
        )
        connection.close()
        return True
    except Exception as e:
        print(f"RabbitMQ error: {e}")
        return False


@method_decorator(csrf_exempt, name='dispatch')
class PredictView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        global consecutive_fatigue_count, last_alert_time
        try:
            if 'image' in request.FILES:
                uploaded_file = request.FILES['image']
                image_bytes = uploaded_file.read()
                image = Image.open(io.BytesIO(image_bytes))
            elif 'image' in request.data:
                image_data = request.data['image']
                if isinstance(image_data, str) and image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                    image_bytes = base64.b64decode(image_data)
                    image = Image.open(io.BytesIO(image_bytes))
                elif isinstance(image_data, str) and image_data.startswith(('http://', 'https://')):
                    image = Image.open(urllib.request.urlopen(image_data))
                else:
                    image = Image.open(io.BytesIO(image_data))
            else:
                return Response(
                    {'error': 'Aucune image fournie.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            image = image.convert('RGB')
            result, confidence = model_instance.predict(image)
            
            current_time = time.time()
            
            # كشف التعب - عتبة 85% (صارمة)
            is_fatigued = (result == "fatigue" and confidence > CONFIDENCE_THRESHOLD / 100)
            
            if is_fatigued:
                consecutive_fatigue_count += 1
                print(f"📊 Fatigue: {consecutive_fatigue_count}/12 (conf: {confidence:.1f}%)")
            else:
                if consecutive_fatigue_count > 0:
                    print(f"🔄 Reset (was {consecutive_fatigue_count})")
                consecutive_fatigue_count = 0
            
            # مستويات التحذير
            if consecutive_fatigue_count >= ALERT_THRESHOLD:
                alert_level = 'critical'
                current_status = 'fatigue'
                print(f"🔴 CRITICAL ALERT!")
            elif consecutive_fatigue_count >= WARNING_THRESHOLD:
                alert_level = 'warning'
                current_status = 'fatigue'
                print(f"🟡 WARNING")
            else:
                alert_level = 'normal'
                current_status = 'active'
            
            # إرسال إنذار
            should_alert = False
            if consecutive_fatigue_count >= ALERT_THRESHOLD:
                if current_time - last_alert_time > ALERT_COOLDOWN:
                    should_alert = True
                    last_alert_time = current_time
                    consecutive_fatigue_count = 0
                    print(f"🚨 ALERT SENT! 🚨")
                    
                    driver_id = request.data.get('driver_id', None)
                    if driver_id:
                        send_alert_to_rabbitmq(driver_id, confidence)

            return Response({
                'prediction': current_status,
                'confidence': confidence,
                'raw_prediction': result,
                'raw_confidence': confidence,
                'should_alert': should_alert,
                'alert_level': alert_level,
                'consecutive_count': consecutive_fatigue_count
            })

        except Exception as e:
            return Response(
                {'error': f"Erreur: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok', 'model_loaded': True})
