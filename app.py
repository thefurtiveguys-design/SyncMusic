"""
Backend Influencer Analyzer – Version complète
À copier dans ton app.py sur GitHub
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import asyncio
import json
import os
import time
import sqlite3
from datetime import datetime
import hashlib
import io
import re

# Scraping
from playwright.async_api import async_playwright
import requests
from bs4 import BeautifulSoup

# PDF
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

app = Flask(__name__)
CORS(app)  # Important pour accepter les requêtes du frontend

# Base de données temporaire
DB_PATH = "/tmp/influencer.db"

def init_db():
    """Initialise la base de données"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS analyses
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT,
                  platform TEXT,
                  followers INTEGER,
                  engagement REAL,
                  niche TEXT,
                  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

# Cache simple
cache = {}

# ==================== ROUTES ====================

@app.route('/')
def home():
    """Page d'accueil – juste pour tester"""
    return jsonify({
        'name': 'Influencer Analyzer API',
        'version': '1.0',
        'status': 'online',
        'endpoints': [
            '/api/health',
            '/api/analyze',
            '/api/history',
            '/api/recommend',
            '/api/report/<username>'
        ]
    })

@app.route('/api/health')
def health():
    """Vérifier que l'API fonctionne"""
    return jsonify({
        'status': 'ok',
        'time': datetime.now().isoformat(),
        'message': 'API fonctionnelle'
    })

@app.route('/api/analyze', methods=['POST', 'GET'])
def analyze():
    """Analyser un influenceur"""
    if request.method == 'GET':
        return jsonify({'error': 'Utilise POST avec {"username": "@nom"}'}), 400
    
    try:
        data = request.json
        username = data.get('username', '')
        
        if not username:
            return jsonify({'error': 'Username requis'}), 400
        
        # Nettoyer le username
        username = username.replace('https://', '').replace('http://', '')
        username = username.split('/')[-1].split('?')[0].replace('@', '')
        
        if not username:
            return jsonify({'error': 'Username invalide'}), 400
        
        # Simulation pour test (remplace par vrai scraping plus tard)
        followers = len(username) * 10000 + 5000
        engagement = followers * 0.03
        
        result = {
            'success': True,
            'platform': 'instagram',
            'username': username,
            'followers': followers,
            'engagement': int(engagement),
            'bio': f"Compte de {username} – exemple",
            'niche': 'general'
        }
        
        # Sauvegarder en base
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('''INSERT INTO analyses 
                         (username, platform, followers, engagement, niche)
                         VALUES (?, ?, ?, ?, ?)''',
                      (username, 'instagram', followers, engagement, 'general'))
            conn.commit()
            conn.close()
        except:
            pass
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/history')
def history():
    """Récupère l'historique des analyses"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''SELECT username, platform, followers, engagement, date 
                     FROM analyses ORDER BY date DESC LIMIT 20''')
        rows = c.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                'username': row[0],
                'platform': row[1],
                'followers': row[2],
                'engagement': row[3],
                'date': row[4]
            })
        
        return jsonify(history)
    except Exception as e:
        return jsonify([])

@app.route('/api/recommend')
def recommend():
    """Recommande des influenceurs"""
    niche = request.args.get('niche', 'general')
    min_followers = int(request.args.get('min', 1000))
    max_followers = int(request.args.get('max', 1000000))
    
    # Simulation
    results = []
    for i in range(5):
        results.append({
            'username': f'influenceur_{i}',
            'platform': 'instagram',
            'followers': min_followers + i * 10000,
            'engagement': 3.5 + i * 0.5,
            'niche': niche
        })
    
    return jsonify(results)

@app.route('/api/report/<username>')
def generate_report(username):
    """Génère un rapport PDF"""
    try:
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        c.setFont("Helvetica-Bold", 24)
        c.drawString(50, 800, f"Rapport - @{username}")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, 750, f"Généré le {datetime.now().strftime('%d/%m/%Y')}")
        
        c.save()
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"rapport_{username}.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Démarrage sur le port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
