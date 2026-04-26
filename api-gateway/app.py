from flask import Flask, request, jsonify
import requests
import jwt

app = Flask(__name__)

# Configuration des services
AUTH_SERVICE_URL = "http://auth-service:8002"
DL_API_URL = "http://dl-api:8000"

# Mock database pour les conducteurs
conducteurs = []
alertes = []

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'api-gateway'})

@app.route('/api/conducteurs', methods=['GET'])
def get_conducteurs():
    return jsonify(conducteurs)

@app.route('/api/conducteurs', methods=['POST'])
def create_conducteur():
    data = request.get_json()
    conducteurs.append(data)
    return jsonify(data), 201

@app.route('/api/alertes', methods=['GET'])
def get_alertes():
    return jsonify(alertes)

@app.route('/api/alertes', methods=['POST'])
def create_alerte():
    data = request.get_json()
    alertes.append(data)
    return jsonify(data), 201

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    response = requests.post(f'{DL_API_URL}/api/predict/', files={'image': file})
    return jsonify(response.json()), response.status_code

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)