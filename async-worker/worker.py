import pika
import json
import time
import requests
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ====================== CONFIGURATION ======================
RABBITMQ_HOST = 'rabbitmq'          # Nom du service dans Docker Compose
QUEUE_NAME = 'task_queue'
DL_API_URL = 'http://dl-api:8000'   # URL du micro-service Deep Learning

# Configuration du logging (en français)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def process_image(image_data):
    """Envoie l'image au micro-service Deep Learning et récupère la prédiction"""
    try:
        response = requests.post(
            f'{DL_API_URL}/api/predict/',
            files={'image': image_data},      # Envoi en tant que fichier
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logging.error(f"Erreur lors de l'appel à l'API DL : {e}")
        return {'error': str(e), 'prediction': 'error'}


def send_alert_email(conducteur_email: str, confidence: float):
    """Envoie un email d'alerte lorsque le conducteur est détecté fatigué"""
    try:
        msg = MIMEMultipart()
        msg['From'] = 'alert@drivervigilance.com'
        msg['To'] = conducteur_email
        msg['Subject'] = '⚠️ ALERTE - Conducteur FATIGUE ⚠️'

        body = f"""
⚠️ ALERTE IMMÉDIATE - Conducteur détecté FATIGUE ⚠️

Confiance : {confidence:.2f}%
Heure     : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Veuillez vous arrêter immédiatement et prendre du repos !

Ce message est généré automatiquement par le système Driver Vigilance Monitoring.
        """

        msg.attach(MIMEText(body, 'plain'))

        # === À décommenter et configurer quand tu auras un vrai serveur SMTP ===
        # server = smtplib.SMTP('smtp.gmail.com', 587)
        # server.starttls()
        # server.login('ton_email@gmail.com', 'ton_app_password')
        # server.send_message(msg)
        # server.quit()

        logging.info(f"✅ Email d'alerte envoyé à {conducteur_email}")

    except Exception as e:
        logging.error(f"Échec de l'envoi de l'email : {e}")


def callback(ch, method, properties, body):
    """Fonction appelée à chaque fois qu'une image arrive dans la queue"""
    try:
        message = json.loads(body)
        image_data = message.get('image')               # Doit être en bytes
        conducteur_email = message.get('email')         # Email du conducteur (optionnel mais recommandé)

        if not image_data:
            logging.error("Message reçu sans image !")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        logging.info("📸 Début du traitement de l'image...")

        result = process_image(image_data)

        logging.info(f"✅ Résultat du modèle : {result}")

        # Si le conducteur est fatigué → envoi d'alerte
        if result.get('prediction') == 'fatigue':
            confidence = result.get('confidence', 0)
            if conducteur_email:
                send_alert_email(conducteur_email, confidence)
            else:
                logging.warning("⚠️ Aucune adresse email fournie pour l'alerte")

        # Accuser réception du message (important pour ne pas perdre la tâche)
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        logging.error(f"Erreur pendant le traitement du message : {e}")
        # Remettre le message dans la queue en cas d'erreur
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main():
    """Connexion à RabbitMQ avec système de retry"""
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

            # Création de la queue durable
            channel.queue_declare(queue=QUEUE_NAME, durable=True)

            # Limiter à une seule tâche à la fois par worker
            channel.basic_qos(prefetch_count=1)

            channel.basic_consume(
                queue=QUEUE_NAME,
                on_message_callback=callback,
                auto_ack=False
            )

            logging.info("🚀 Worker RabbitMQ démarré et en attente de messages...")
            channel.start_consuming()

        except Exception as e:
            logging.error(f"Impossible de se connecter à RabbitMQ : {e}")
            time.sleep(5)


if __name__ == '__main__':
    main()