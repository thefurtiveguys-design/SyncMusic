from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return {'status': 'ok'}

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    username = data.get('username')
    return {'success': True, 'username': username, 'followers': 15000}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
