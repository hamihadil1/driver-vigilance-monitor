from flask import Flask, request, jsonify
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'votre-secret-key-tres-securisee'

# Mock database
users = {}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'auth-service'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    fullname = data.get('fullname')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    if email in users:
        return jsonify({'error': 'User already exists'}), 400
    
    users[email] = {'password': password, 'fullname': fullname}
    
    return jsonify({'message': 'User created successfully', 'user_id': email}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if email not in users or users[email]['password'] != password:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({'access': token, 'refresh': token})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8002)