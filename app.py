"""
Influencer Analyzer SaaS – Backend Flask
Installation: pip install flask flask-cors playwright beautifulsoup4 requests pandas
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import asyncio
import json
import os
import time
import hashlib
from datetime import datetime
import threading
import sqlite3

# Scraping
from playwright.async_api import async_playwright
import requests
from bs4 import BeautifulSoup

# Report generation
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import io

app = Flask(__name__)
CORS(app)  # Permet les requêtes depuis n'importe quel frontend

# Base de données simplifiée
DB_PATH = "influencer.db"

def init_db():
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

# Cache pour éviter de rescraper trop souvent
cache = {}
CACHE_DURATION = 3600  # 1 heure

# ==================== SCRAPERS ====================

async def scrape_instagram(username):
    """Scrape un profil Instagram"""
    try:
        username = username.replace('@', '').strip()
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(f"https://www.instagram.com/{username}/")
            
            # Attendre le chargement
            await page.wait_for_timeout(3000)
            
            # Extraire les meta données
            meta = await page.query_selector('meta[property="og:description"]')
            content = await meta.get_attribute('content') if meta else ""
            
            # Parser "X Followers, Y Following, Z Posts"
            followers = 0
            if content:
                parts = content.split(',')
                for part in parts:
                    if 'Follower' in part:
                        followers = int(''.join(filter(str.isdigit, part)))
            
            # Bio
            bio_elem = await page.query_selector('div._aa_c')
            bio = await bio_elem.inner_text() if bio_elem else ""
            
            await browser.close()
            
            return {
                'success': True,
                'platform': 'instagram',
                'username': username,
                'followers': followers,
                'bio': bio[:200],
                'engagement': round(followers * 0.03),  # Approximation
                'niche': detect_niche(bio)
            }
    except Exception as e:
        return {'success': False, 'error': str(e)}

async def scrape_tiktok(username):
    """Scrape un profil TikTok"""
    try:
        username = username.replace('@', '').strip()
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(f"https://www.tiktok.com/@{username}")
            
            await page.wait_for_timeout(3000)
            
            # Extraire les stats
            followers_elem = await page.query_selector('[data-e2e="followers-count"]')
            followers_text = await followers_elem.inner_text() if followers_elem else "0"
            
            # Convertir "1.2M" en 1200000
            followers = parse_count(followers_text)
            
            # Bio
            bio_elem = await page.query_selector('[data-e2e="user-bio"]')
            bio = await bio_elem.inner_text() if bio_elem else ""
            
            await browser.close()
            
            return {
                'success': True,
                'platform': 'tiktok',
                'username': username,
                'followers': followers,
                'bio': bio[:200],
                'engagement': round(followers * 0.05),
                'niche': detect_niche(bio)
            }
    except Exception as e:
        return {'success': False, 'error': str(e)}

async def scrape_youtube(channel):
    """Scrape une chaîne YouTube"""
    try:
        channel = channel.replace('@', '').strip()
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            if channel.startswith('UC'):
                url = f"https://www.youtube.com/channel/{channel}/about"
            else:
                url = f"https://www.youtube.com/@{channel}/about"
            
            await page.goto(url)
            await page.wait_for_timeout(3000)
            
            # Subscribers
            subs_elem = await page.query_selector('#subscriber-count')
            subs_text = await subs_elem.inner_text() if subs_elem else "0"
            subscribers = int(''.join(filter(str.isdigit, subs_text))) if subs_text else 0
            
            # Description
            desc_elem = await page.query_selector('#description-container')
            description = await desc_elem.inner_text() if desc_elem else ""
            
            await browser.close()
            
            return {
                'success': True,
                'platform': 'youtube',
                'username': channel,
                'followers': subscribers,
                'bio': description[:200],
                'engagement': round(subscribers * 0.02),
                'niche': detect_niche(description)
            }
    except Exception as e:
        return {'success': False, 'error': str(e)}

def parse_count(text):
    """Convertit '1.2M' en 1200000"""
    text = text.lower().strip()
    multipliers = {'k': 1000, 'm': 1000000, 'b': 1000000000}
    
    for suffix, multiplier in multipliers.items():
        if suffix in text:
            num = float(text.replace(suffix, '').replace(',', ''))
            return int(num * multiplier)
    
    try:
        return int(''.join(filter(str.isdigit, text)))
    except:
        return 0

def detect_niche(text):
    """Détecte la niche à partir du texte"""
    text = text.lower()
    niches = {
        'fitness': ['fitness', 'gym', 'workout', 'muscle', 'yoga', 'sport'],
        'voyage': ['travel', 'voyage', 'trip', 'wanderlust', 'adventure'],
        'mode': ['fashion', 'style', 'outfit', 'mode', 'beauté', 'beauty'],
        'tech': ['tech', 'technology', 'gadget', 'iphone', 'android', 'computer'],
        'cuisine': ['food', 'cooking', 'recipe', 'cuisine', 'recette', 'baking'],
        'jeux': ['gaming', 'game', 'twitch', 'playstation', 'xbox', 'minecraft'],
        'business': ['business', 'entrepreneur', 'marketing', 'startup', 'money'],
        'art': ['art', 'artist', 'drawing', 'painting', 'photography']
    }
    
    for niche, keywords in niches.items():
        for kw in keywords:
            if kw in text:
                return niche
    return 'general'

# ==================== ROUTES API ====================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'time': datetime.now().isoformat()})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Point d'entrée principal pour l'analyse"""
    data = request.json
    username = data.get('username', '')
    platform = data.get('platform', 'auto')
    
    if not username:
        return jsonify({'error': 'Username required'}), 400
    
    # Nettoyer le username
    username = username.strip().replace('https://', '').replace('http://', '')
    
    # Détection auto de la plateforme
    if platform == 'auto':
        if 'instagram.com' in username:
            platform = 'instagram'
            username = username.split('instagram.com/')[-1].split('/')[0].split('?')[0]
        elif 'tiktok.com' in username:
            platform = 'tiktok'
            username = username.split('tiktok.com/@')[-1].split('/')[0].split('?')[0]
        elif 'youtube.com' in username:
            platform = 'youtube'
            if '/channel/' in username:
                username = username.split('/channel/')[-1].split('/')[0]
            elif '/@' in username:
                username = username.split('/@')[-1].split('/')[0]
        else:
            # Par défaut, on essaie les trois
            platform = 'all'
    
    # Vérifier le cache
    cache_key = f"{platform}_{username}"
    if cache_key in cache:
        cache_time, cache_data = cache[cache_key]
        if time.time() - cache_time < CACHE_DURATION:
            return jsonify(cache_data)
    
    # Lancer le scraping
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        if platform == 'instagram':
            result = loop.run_until_complete(scrape_instagram(username))
        elif platform == 'tiktok':
            result = loop.run_until_complete(scrape_tiktok(username))
        elif platform == 'youtube':
            result = loop.run_until_complete(scrape_youtube(username))
        elif platform == 'all':
            # Scraper les trois en parallèle
            async def scrape_all():
                insta = asyncio.create_task(scrape_instagram(username))
                tiktok = asyncio.create_task(scrape_tiktok(username))
                youtube = asyncio.create_task(scrape_youtube(username))
                return await asyncio.gather(insta, tiktok, youtube)
            
            results = loop.run_until_complete(scrape_all())
            result = {
                'success': True,
                'multi': True,
                'results': results
            }
        else:
            return jsonify({'error': 'Plateforme non supportée'}), 400
        
        loop.close()
        
        if result.get('success'):
            # Mettre en cache
            cache[cache_key] = (time.time(), result)
            
            # Sauvegarder en base
            if not platform == 'all':
                save_to_db(result)
            
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def save_to_db(data):
    """Sauvegarde une analyse en base"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO analyses 
                     (username, platform, followers, engagement, niche)
                     VALUES (?, ?, ?, ?, ?)''',
                  (data['username'], data['platform'], 
                   data['followers'], data['engagement'], data['niche']))
        conn.commit()
        conn.close()
    except:
        pass

@app.route('/api/history', methods=['GET'])
def get_history():
    """Récupère l'historique des analyses"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''SELECT username, platform, followers, engagement, niche, date 
                 FROM analyses ORDER BY date DESC LIMIT 50''')
    rows = c.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            'username': row[0],
            'platform': row[1],
            'followers': row[2],
            'engagement': row[3],
            'niche': row[4],
            'date': row[5]
        })
    
    return jsonify(history)

@app.route('/api/recommend', methods=['GET'])
def recommend():
    """Recommande des influenceurs par niche"""
    niche = request.args.get('niche', 'general')
    min_followers = int(request.args.get('min_followers', 1000))
    max_followers = int(request.args.get('max_followers', 10000000))
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''SELECT username, platform, followers, engagement, niche, date 
                 FROM analyses 
                 WHERE niche = ? AND followers BETWEEN ? AND ?
                 ORDER BY engagement DESC LIMIT 20''',
              (niche, min_followers, max_followers))
    rows = c.fetchall()
    conn.close()
    
    recommendations = []
    for row in rows:
        recommendations.append({
            'username': row[0],
            'platform': row[1],
            'followers': row[2],
            'engagement': row[3],
            'niche': row[4],
            'date': row[5]
        })
    
    return jsonify(recommendations)

@app.route('/api/report/<username>', methods=['GET'])
def generate_report(username):
    """Génère un rapport PDF"""
    try:
        # Créer le PDF
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # En-tête
        c.setFont("Helvetica-Bold", 24)
        c.drawString(50, height - 50, f"Rapport - {username}")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 80, f"Généré le {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        
        # Contenu
        y = height - 120
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Statistiques")
        
        # Récupérer les dernières données
        conn = sqlite3.connect(DB_PATH)
        c2 = conn.cursor()
        c2.execute('''SELECT platform, followers, engagement, niche, date 
                     FROM analyses WHERE username = ? ORDER BY date DESC LIMIT 1''', 
                  (username,))
        row = c2.fetchone()
        conn.close()
        
        if row:
            y -= 30
            c.setFont("Helvetica", 12)
            c.drawString(70, y, f"Plateforme: {row[0]}")
            y -= 20
            c.drawString(70, y, f"Followers: {row[1]:,}")
            y -= 20
            c.drawString(70, y, f"Engagement: {row[2]}%")
            y -= 20
            c.drawString(70, y, f"Niche: {row[3]}")
        
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
    print("""
    ╔══════════════════════════════════════════╗
    ║   INFLUENCER ANALYZER SAAS - BACKEND     ║
    ║   http://localhost:5000                   ║
    ╚══════════════════════════════════════════╝
    """)
    app.run(debug=True, port=5000)
