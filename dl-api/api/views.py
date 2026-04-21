from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # تغيير من IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from PIL import Image
import io
import base64
import urllib.request

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from dl_model.predict import model_instance

@method_decorator(csrf_exempt, name='dispatch')
class PredictView(APIView):
    authentication_classes = []  # تعطيل التوثيق
    permission_classes = [AllowAny]  # السماح للجميع
    
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            # ====================== 1. معالجة الصورة ======================
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

            # ====================== 2. التنبؤ ======================
            result, confidence = model_instance.predict(image)

            # ====================== 3. الرد ======================
            return Response({
                'prediction': result,
                'confidence': round(confidence * 100, 2),
                'message': 'Conducteur FATIGUE - Alerte!' if result == 'fatigue' 
                          else 'Conducteur ACTIF'
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