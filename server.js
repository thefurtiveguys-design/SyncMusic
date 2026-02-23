// server.js - Backend Node.js simple et puissant
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Sert les fichiers HTML/CSS

// ========== SCRAPING INSTAGRAM ==========
async function scrapeInstagram(username) {
    try {
        username = username.replace('@', '').trim();
        console.log(`🔍 Scraping Instagram: ${username}`);
        
        // Méthode 1: API publique
        const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        const response = await axios.get(url, { headers, timeout: 5000 });
        
        if (response.data && response.data.data) {
            const user = response.data.data.user;
            return {
                success: true,
                platform: 'instagram',
                username: username,
                followers: user.edge_followed_by.count,
                following: user.edge_follow.count,
                posts: user.edge_owner_to_timeline_media.count,
                fullName: user.full_name,
                bio: user.biography,
                isPrivate: user.is_private,
                profilePic: user.profile_pic_url_hd
            };
        }
        
        // Méthode 2: Fallback scraping HTML
        const htmlUrl = `https://www.instagram.com/${username}/`;
        const htmlResponse = await axios.get(htmlUrl, { headers, timeout: 5000 });
        const $ = cheerio.load(htmlResponse.data);
        
        // Chercher les meta tags
        const metaDesc = $('meta[property="og:description"]').attr('content');
        if (metaDesc) {
            const followersMatch = metaDesc.match(/([0-9,.]+)\s*(Follower|Followers)/);
            const followers = followersMatch ? 
                parseInt(followersMatch[1].replace(/,/g, '')) : 0;
            
            return {
                success: true,
                platform: 'instagram',
                username: username,
                followers: followers,
                bio: $('meta[property="og:title"]').attr('content') || ''
            };
        }
        
        return { success: false, error: 'Compte privé ou inexistant' };
        
    } catch (error) {
        console.error('❌ Erreur Instagram:', error.message);
        return { success: false, error: error.message };
    }
}

// ========== SCRAPING TIKTOK ==========
async function scrapeTikTok(username) {
    try {
        username = username.replace('@', '').trim();
        console.log(`🔍 Scraping TikTok: ${username}`);
        
        // API publique TikTok
        const url = `https://www.tiktok.com/api/user/detail/?unique_id=@${username}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        };
        
        const response = await axios.get(url, { headers, timeout: 5000 });
        
        if (response.data && response.data.userInfo) {
            const user = response.data.userInfo.user;
            const stats = response.data.userInfo.stats;
            
            return {
                success: true,
                platform: 'tiktok',
                username: username,
                followers: stats.followerCount,
                following: stats.followingCount,
                likes: stats.heartCount,
                videos: stats.videoCount,
                fullName: user.nickname,
                bio: user.signature,
                profilePic: user.avatarLarger
            };
        }
        
        return { success: false, error: 'Utilisateur non trouvé' };
        
    } catch (error) {
        console.error('❌ Erreur TikTok:', error.message);
        return { success: false, error: error.message };
    }
}

// ========== SCRAPING YOUTUBE ==========
async function scrapeYouTube(channelId) {
    try {
        channelId = channelId.replace('@', '').trim();
        console.log(`🔍 Scraping YouTube: ${channelId}`);
        
        // Déterminer l'URL
        let url;
        if (channelId.startsWith('UC')) {
            url = `https://www.youtube.com/channel/${channelId}/about`;
        } else {
            url = `https://www.youtube.com/@${channelId}/about`;
        }
        
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9'
        };
        
        const response = await axios.get(url, { headers, timeout: 5000 });
        const $ = cheerio.load(response.data);
        
        // Extraction des abonnés
        let subscribers = 0;
        const subText = $('#subscriber-count').text() || 
                       $('yt-formatted-string#subscriber-count').text();
        
        if (subText) {
            const match = subText.match(/([0-9,.]+)\s*(abonnés|subscribers)/i);
            if (match) {
                subscribers = parseInt(match[1].replace(/,/g, ''));
            }
        }
        
        // Nom de la chaîne
        const name = $('yt-formatted-string#channel-name').text() || channelId;
        
        return {
            success: true,
            platform: 'youtube',
            username: channelId,
            followers: subscribers,
            fullName: name.trim(),
            url: url
        };
        
    } catch (error) {
        console.error('❌ Erreur YouTube:', error.message);
        return { success: false, error: error.message };
    }
}

// ========== ROUTES API ==========
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { username, platform } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username requis' });
        }
        
        let result;
        
        switch(platform) {
            case 'instagram':
                result = await scrapeInstagram(username);
                break;
            case 'tiktok':
                result = await scrapeTikTok(username);
                break;
            case 'youtube':
                result = await scrapeYouTube(username);
                break;
            default:
                // Auto-détection
                const results = await Promise.all([
                    scrapeInstagram(username).catch(() => null),
                    scrapeTikTok(username).catch(() => null),
                    scrapeYouTube(username).catch(() => null)
                ]);
                
                result = {
                    success: true,
                    multi: true,
                    results: results.filter(r => r && r.success)
                };
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════╗
    ║   INFLUENCER SCRAPER POWERED       ║
    ║   🚀 Serveur démarré                ║
    ║   📍 http://localhost:${PORT}        ║
    ╚════════════════════════════════════╝
    `);
});
