import pika
import json
import requests

RABBIT_HOST = 'rabbitmq'
QUEUE = 'alerts'
AUTH_API_URL = 'http://auth-service:8002/api/alertes/'
TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc1Njg4OTk0LCJpYXQiOjE3NzUwODQxOTQsImp0aSI6ImI5NDY1M2RkNjFiYzRkODg4ZjliOTBiNTRiZTFhZTUwIiwidXNlcl9pZCI6IjEifQ.Kvw0ZLrUb_pPMx_M-6gciBx4S1zHLsD6z6b4JqWOhZc'

def callback(ch, method, properties, body):
    data = json.loads(body)
    print(f"Received: {data}")
    headers = {'Authorization': f'Bearer {TOKEN}'}
    try:
        response = requests.post(AUTH_API_URL, json=data, headers=headers)
        if response.status_code == 201:
            print("Alert saved successfully")
        else:
            print(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def start_consumer():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBIT_HOST))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE, durable=True)
    channel.basic_consume(queue=QUEUE, on_message_callback=callback, auto_ack=True)
    print("Waiting for messages...")
    channel.start_consuming()

if __name__ == "__main__":
    start_consumer()
