import pika
import json

connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
channel = connection.channel()
channel.queue_declare(queue='alerts', durable=True)

message = json.dumps({'type': 'drowsy', 'conducteur': 1})
channel.basic_publish(exchange='', routing_key='alerts', body=message)
print(" [x] Sent test message")
connection.close()
