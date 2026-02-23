"""
Backend Influencer Analyzer – Version ultra-simple qui marche à tous les coups
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permet les requêtes depuis n'importe quel frontend

@app.route('/')
def home():
    """Page d'accueil"""
    return jsonify({
        'name': 'Influencer Analyzer API',
        'status': 'online',
        'message': 'API fonctionnelle'
    })

@app.route('/api/health')
def health():
    """Vérification santé"""
    return jsonify({
        'status': 'ok',
        'time': datetime.now().isoformat()
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Analyser un influenceur (version simplifiée)"""
    try:
        data = request.json
        username = data.get('username', '')
        
        if not username:
            return jsonify({'error': 'Username requis'}), 400
        
        # Nettoyer le username
        username = username.replace('@', '').strip()
        
        # Simuler des données (pour tester)
        return jsonify({
            'success': True,
            'platform': 'instagram',
            'username': username,
            'followers': 15000,
            'engagement': 450,
            'bio': f'Compte de {username}',
            'niche': 'general'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/history')
def history():
    """Historique simulé"""
    return jsonify([
        {'username': 'test1', 'platform': 'instagram', 'followers': 10000, 'date': '2024-01-01'},
        {'username': 'test2', 'platform': 'tiktok', 'followers': 50000, 'date': '2024-01-02'}
    ])

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Démarrage sur le port {port}")
    app.run(host='0.0.0.0', port=port)
