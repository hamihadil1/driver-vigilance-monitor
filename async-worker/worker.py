import pika
import json
import time
import requests
import logging
from datetime import datetime
from collections import defaultdict

# ====================== CONFIGURATION ======================
RABBITMQ_HOST = 'rabbitmq'
TASK_QUEUE = 'task_queue'
ALERT_QUEUE = 'fatigue_alerts'
API_GATEWAY_URL = 'http://api-gateway:8001'

# منع الإنذارات المتكررة
ALERT_COOLDOWN = 30
last_alert_time = defaultdict(float)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def save_alert_to_database(driver_id, confidence):
    try:
        response = requests.post(
            f'{API_GATEWAY_URL}/api/alerts',
            json={
                'driver_id': driver_id,
                'alert_type': 'fatigue',
                'confidence': confidence,
                'status': 'active',
                'timestamp': datetime.now().isoformat()
            },
            timeout=5
        )
        return response.status_code == 200
    except Exception as e:
        logging.error(f"Error saving alert: {e}")
        return False

def process_fatigue_alert(message):
    driver_id = message.get('driver_id')
    confidence = message.get('confidence', 0)
    
    if not driver_id:
        logging.warning("Message reçu sans driver_id")
        return
    
    current_time = time.time()
    if current_time - last_alert_time[driver_id] < ALERT_COOLDOWN:
        logging.info(f"⏭️ Alerte ignorée pour {driver_id} (cooldown)")
        return
    
    last_alert_time[driver_id] = current_time
    logging.info(f"🚨 ALERTE FATIGUE - Driver: {driver_id}, Confiance: {confidence}%")
    
    if save_alert_to_database(driver_id, confidence):
        logging.info(f"✅ Alerte sauvegardée pour {driver_id}")

def process_image(image_data):
    try:
        response = requests.post(
            'http://dl-api:8000/api/predict/',
            files={'image': image_data},
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logging.error(f"Erreur appel API DL: {e}")
        return {'error': str(e), 'prediction': 'error'}

def callback(ch, method, properties, body):
    try:
        message = json.loads(body)
        
        if message.get('type') == 'fatigue_alert':
            process_fatigue_alert(message)
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return
        
        image_data = message.get('image')
        if not image_data:
            logging.error("Message reçu sans image!")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return
        
        logging.info("📸 Traitement de l'image...")
        result = process_image(image_data)
        logging.info(f"✅ Résultat: {result}")
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        logging.error(f"Erreur: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def main():
    while True:
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    connection_attempts=10,
                    retry_delay=5
                )
            )
            channel = connection.channel()
            
            channel.queue_declare(queue=TASK_QUEUE, durable=True)
            channel.queue_declare(queue=ALERT_QUEUE, durable=True)
            channel.basic_qos(prefetch_count=3)
            channel.basic_consume(queue=TASK_QUEUE, on_message_callback=callback, auto_ack=False)
            channel.basic_consume(queue=ALERT_QUEUE, on_message_callback=callback, auto_ack=False)
            
            logging.info("🚀 Worker démarré - Queues: task_queue, fatigue_alerts")
            channel.start_consuming()
            
        except Exception as e:
            logging.error(f"Erreur connexion: {e}")
            time.sleep(5)

if __name__ == '__main__':
    main()