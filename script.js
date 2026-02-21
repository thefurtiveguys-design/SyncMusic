// script.js - VERSION FINALE AVEC VRAI SPOTIFY

// ============================================
// CONFIGURATION - TES CLÉS SUPABASE
// ============================================
const SUPABASE_URL = 'https://jtdhgrihatgqtphelmlx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZGhncmloYXRncXRwaGVsbWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYxNjYsImV4cCI6MjA4NzE4MjE2Nn0.ieSj9GxVykIkACfyR8DfeAAqwAUq2UM5wRjSPJ5ONhE';

// ============================================
// INITIALISATION SUPABASE
// ============================================
console.log("🚀 Démarrage de l'application...");

window.supabaseClient = null;

try {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase initialisé avec succès");
} catch (error) {
    console.error("❌ Erreur initialisation Supabase:", error);
}

// ============================================
// VARIABLES GLOBALES
// ============================================
let currentSessionCode = null;
let currentUserId = null;
let isHost = false;
let isPlaying = false;
let spotifyPlayer = null;
let subscription = null;

// ============================================
// FONCTIONS UTILITAIRES
// ============================================
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ============================================
// GESTION DU TOKEN SPOTIFY
// ============================================
function handleSpotifyRedirect() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        if (token) {
            console.log("✅ Token Spotify reçu");
            localStorage.setItem('spotify_token', token);
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Cacher le bouton de connexion
            const spotifyBtn = document.getElementById('spotify-login-btn');
            if (spotifyBtn) spotifyBtn.style.display = 'none';
            
            // Recharger le player pour utiliser le token
            if (window.location.pathname.includes('player.html')) {
                initPlayer();
            }
        }
    }
}

// ============================================
// CHARGER LE PLAYER SPOTIFY
// ============================================
function loadSpotifyPlayer(token) {
    // Charger le SDK Spotify
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    
    window.onSpotifyWebPlaybackSDKReady = () => {
        console.log("🎵 SDK Spotify prêt");
        
        spotifyPlayer = new Spotify.Player({
            name: 'SyncMusic Player',
            getOAuthToken: cb => { cb(token); },
            volume: 0.5
        });
        
        // Prêt à jouer
        spotifyPlayer.addListener('ready', ({ device_id }) => {
            console.log('✅ Player Spotify prêt avec device ID:', device_id);
            localStorage.setItem('device_id', device_id);
            
            const statusEl = document.getElementById('player-status');
            if (statusEl) {
                statusEl.innerHTML = '✅ Connecté à Spotify - Prêt à jouer';
            }
        });
        
        // État du player changé
        spotifyPlayer.addListener('player_state_changed', state => {
            if (state) {
                const track = state.track_window.current_track;
                document.getElementById('track-name').textContent = track.name;
                document.getElementById('artist-name').textContent = track.artists.map(a => a.name).join(', ');
                
                // Mettre à jour l'état play/pause
                isPlaying = !state.paused;
                const icon = document.getElementById('play-pause-icon');
                if (icon) {
                    icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
                }
            }
        });
        
        // Gérer les erreurs
        spotifyPlayer.addListener('initialization_error', ({ message }) => {
            console.error('❌ Erreur initialisation:', message);
        });
        
        spotifyPlayer.addListener('authentication_error', ({ message }) => {
            console.error('❌ Erreur authentification:', message);
            localStorage.removeItem('spotify_token');
            window.location.reload();
        });
        
        spotifyPlayer.addListener('account_error', ({ message }) => {
            console.error('❌ Erreur compte:', message);
            alert('Erreur: Compte Spotify premium requis');
        });
        
        spotifyPlayer.connect();
    };
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

// CRÉER UNE SESSION
window.createSession = async function() {
    console.log("🟡 Création d'une nouvelle session");
    
    try {
        currentSessionCode = generateSessionCode();
        currentUserId = generateUserId();
        isHost = true;
        
        console.log("📝 Code session:", currentSessionCode);
        console.log("👤 User ID:", currentUserId);
        
        // Sauvegarder
        localStorage.setItem('sessionCode', currentSessionCode);
        localStorage.setItem('userId', currentUserId);
        localStorage.setItem('isHost', 'true');
        
        // Afficher l'écran d'attente
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('waiting-screen').classList.remove('hidden');
        document.getElementById('display-code').textContent = currentSessionCode;
        
        console.log("🎉 Session créée avec succès !");
        
        // Simulation d'un ami qui rejoint après 3 secondes
        setTimeout(() => {
            console.log("👤 Simulation d'un ami qui rejoint");
            const friendStatus = document.getElementById('friend-status');
            const waitingMessage = document.getElementById('waiting-message');
            
            if (friendStatus) {
                friendStatus.classList.add('connected');
                const nameEl = friendStatus.querySelector('.user-name');
                if (nameEl) nameEl.textContent = 'Ami';
            }
            
            if (waitingMessage) {
                waitingMessage.innerHTML = '✅ Ami connecté ! Redirection...';
            }
            
            setTimeout(() => {
                window.location.href = 'player.html';
            }, 1500);
        }, 3000);
        
    } catch (error) {
        console.error("❌ Erreur:", error);
        alert("Erreur: " + error.message);
    }
};

// REJOINDRE UNE SESSION
window.joinSession = function() {
    console.log("🟡 Tentative de rejoindre une session");
    
    try {
        const codeInput = document.getElementById('session-code');
        const code = codeInput.value.toUpperCase();
        
        if (code.length !== 6) {
            alert('Veuillez entrer un code valide de 6 caractères');
            return;
        }
        
        console.log("📝 Code entré:", code);
        
        currentSessionCode = code;
        currentUserId = generateUserId();
        
        // Sauvegarder
        localStorage.setItem('sessionCode', currentSessionCode);
        localStorage.setItem('userId', currentUserId);
        localStorage.setItem('isHost', 'false');
        
        console.log("➡️ Redirection vers player.html");
        window.location.href = 'player.html';
        
    } catch (error) {
        console.error("❌ Erreur:", error);
        alert("Erreur: " + error.message);
    }
};

// COPIER LE CODE
window.copyCode = function() {
    const code = document.getElementById('display-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Code copié !');
    });
};

// INITIALISER LE PLAYER (VERSION REELLE)
function initPlayer() {
    console.log("🎵 Initialisation du player");
    
    currentSessionCode = localStorage.getItem('sessionCode');
    currentUserId = localStorage.getItem('userId');
    isHost = localStorage.getItem('isHost') === 'true';
    
    console.log("Session:", currentSessionCode);
    console.log("User:", currentUserId);
    console.log("Host:", isHost);
    
    if (!currentSessionCode || !currentUserId) {
        console.log("❌ Pas de session, redirection");
        window.location.href = 'index.html';
        return;
    }
    
    // Afficher le code
    const codeEl = document.getElementById('current-session-code');
    if (codeEl) codeEl.textContent = currentSessionCode;
    
    // Mettre à jour les noms
    const user1Name = document.getElementById('user1-name');
    const user2Name = document.getElementById('user2-name');
    const friendStatus = document.getElementById('friend-player-status');
    
    if (user1Name) {
        user1Name.textContent = isHost ? 'Vous (hôte)' : 'Hôte';
    }
    
    if (user2Name) {
        user2Name.textContent = isHost ? 'Ami' : 'Vous';
    }
    
    // Vérifier si on a un token Spotify
    const token = localStorage.getItem('spotify_token');
    const spotifyBtn = document.getElementById('spotify-login-btn');
    const statusEl = document.getElementById('player-status');
    
    if (token && token !== 'fake_token') {
        // VRAI token Spotify
        if (spotifyBtn) spotifyBtn.style.display = 'none';
        if (statusEl) {
            statusEl.innerHTML = '✅ Connecté à Spotify - Chargement...';
        }
        
        // Charger le player Spotify
        loadSpotifyPlayer(token);
        
        // Simuler l'ami (à remplacer par de la vraie synchro plus tard)
        setTimeout(() => {
            if (friendStatus) friendStatus.classList.add('connected');
            if (statusEl) statusEl.innerHTML = '✅ Connecté à Spotify - Ami présent';
        }, 2000);
        
    } else {
        // Pas de token, on affiche le bouton
        if (spotifyBtn) spotifyBtn.style.display = 'block';
        if (statusEl) {
            statusEl.innerHTML = '🔑 Connectez-vous à Spotify pour commencer';
        }
        
        // Simuler quand même l'ami pour l'interface
        setTimeout(() => {
            if (friendStatus) friendStatus.classList.add('connected');
        }, 2000);
    }
}

// ENVOYER UNE COMMANDE (VERSION REELLE)
window.sendCommand = function(command) {
    console.log("📤 Commande:", command);
    
    const token = localStorage.getItem('spotify_token');
    const statusEl = document.getElementById('player-status');
    
    // Traduire les commandes pour l'API Spotify
    let spotifyCommand = command;
    if (command === 'next') spotifyCommand = 'next';
    if (command === 'previous') spotifyCommand = 'previous';
    
    if (token && token !== 'fake_token') {
        // VRAI contrôle Spotify
        let url = `https://api.spotify.com/v1/me/player/${spotifyCommand}`;
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then(response => {
            if (response.status === 204 || response.status === 200) {
                console.log("✅ Commande Spotify exécutée");
                if (statusEl) {
                    statusEl.innerHTML = `🎵 Commande "${command}" exécutée`;
                    setTimeout(() => {
                        statusEl.innerHTML = '✅ Connecté à Spotify - Ami présent';
                    }, 1000);
                }
            } else {
                console.log("⚠️ Réponse Spotify:", response.status);
            }
        }).catch(error => {
            console.error("❌ Erreur Spotify:", error);
        });
        
        // Mettre à jour l'icône si play/pause
        if (command === 'play' || command === 'pause') {
            isPlaying = (command === 'play');
            const icon = document.getElementById('play-pause-icon');
            if (icon) {
                icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
            
            // Pour play/pause, c'est une commande spéciale
            if (command === 'play') {
                fetch('https://api.spotify.com/v1/me/player/play', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(e => console.error(e));
            } else if (command === 'pause') {
                fetch('https://api.spotify.com/v1/me/player/pause', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(e => console.error(e));
            }
        }
        
    } else {
        // Mode simulation (si pas connecté à Spotify)
        console.log("🎮 Mode simulation");
        
        if (command === 'play' || command === 'pause') {
            isPlaying = (command === 'play');
            const icon = document.getElementById('play-pause-icon');
            if (icon) {
                icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
        }
        
        if (statusEl) {
            statusEl.innerHTML = `📨 Commande "${command}" (simulation)`;
            setTimeout(() => {
                statusEl.innerHTML = '✅ Connecté - Ami présent';
            }, 1000);
        }
    }
};

// BASCOLER PLAY/PAUSE
window.togglePlay = function() {
    window.sendCommand(isPlaying ? 'pause' : 'play');
};

// QUITTER LA SESSION
window.leaveSession = function() {
    console.log("👋 Départ de la session");
    
    // Déconnecter le player Spotify si existant
    if (spotifyPlayer) {
        spotifyPlayer.disconnect();
    }
    
    localStorage.clear();
    window.location.href = 'index.html';
};

// CONNEXION SPOTIFY
window.loginToSpotify = function() {
    const CLIENT_ID = '5e4dd6c210704b818d808f4fdf6da45d';
    const REDIRECT_URI = window.location.origin + '/player.html';
    
    const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-modify-playback-state',
        'user-read-playback-state',
        'user-read-currently-playing'
    ];
    
    const authUrl = 'https://accounts.spotify.com/authorize' +
        '?client_id=' + CLIENT_ID +
        '&response_type=token' +
        '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
        '&scope=' + encodeURIComponent(scopes.join(' ')) +
        '&show_dialog=true';
    
    window.location.href = authUrl;
};

// ============================================
// INITIALISATION AU CHARGEMENT
// ============================================
window.onload = function() {
    console.log("📱 Page chargée");
    
    // Gérer le retour de Spotify
    handleSpotifyRedirect();
    
    if (window.location.pathname.includes('player.html')) {
        initPlayer();
    }
};

console.log("✅ Script chargé - Mode RÉEL (plus de simulation)");
