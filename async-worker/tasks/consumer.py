import pika
import json
import requests

RABBIT_HOST = 'localhost'
QUEUE = 'alerts'
AUTH_API_URL = 'http://localhost:8001/api/alertes/'

# ضع التوكن الخاص بك هنا (الذي حصلت عليه سابقاً)
TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc0OTkyMTgzLCJpYXQiOjE3NzQ5OTE4ODMsImp0aSI6ImNjNWY0N2ViOTIxYzRlZjhhM2FjZDY0NDRhZWQxZjEzIiwidXNlcl9pZCI6IjEifQ.CaCS419_5W64C3bD6IWkQBGVxHa8e7r5Sg8GLrAx0IQ'

def callback(ch, method, properties, body):
    data = json.loads(body)
    print(f"Received: {data}")
    headers = {'Authorization': f'Bearer {TOKEN}'}
    try:
        response = requests.post(AUTH_API_URL, json=data, headers=headers)
        if response.status_code == 201:
            print("Alert saved successfully")
        else:
            print(f"Failed to save alert: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def start_consumer():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBIT_HOST))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE, durable=True)
    channel.basic_consume(queue=QUEUE, on_message_callback=callback, auto_ack=True)
    print("Waiting for messages. Press CTRL+C to exit.")
    channel.start_consuming()

if __name__ == "__main__":
    start_consumer()
