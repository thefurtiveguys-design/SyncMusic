// script.js - VERSION CORRIGÉE SANS ERREURS

// ============================================
// CONFIGURATION - TES CLÉS SUPABASE
// ============================================
const SUPABASE_URL = 'https://jtdhgrihatgqtphelmlx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZGhncmloYXRncXRwaGVsbWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYxNjYsImV4cCI6MjA4NzE4MjE2Nn0.ieSj9GxVykIkACfyR8DfeAAqwAUq2UM5wRjSPJ5ONhE';

// ============================================
// INITIALISATION SUPABASE - SANS REDECLARATION
// ============================================
console.log("🚀 Démarrage de l'application...");

// NE PAS utiliser "let supabase" - on utilise directement window.supabase
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
// FONCTIONS PRINCIPALES - RENDUES GLOBALES
// ============================================

// CRÉER UNE SESSION
window.createSession = async function() {
    console.log("🟡 Création d'une nouvelle session");
    
    try {
        // Version simplifiée pour tester SANS Supabase
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
                if (nameEl) nameEl.textContent = 'Ami (test)';
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

// INITIALISER LE PLAYER
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
    
    // Simuler ami connecté
    setTimeout(() => {
        if (friendStatus) {
            friendStatus.classList.add('connected');
        }
        
        const statusEl = document.getElementById('player-status');
        if (statusEl) {
            statusEl.innerHTML = '✅ Connecté - Ami présent (simulation)';
        }
    }, 2000);
}

// ENVOYER UNE COMMANDE
window.sendCommand = function(command) {
    console.log("📤 Commande:", command);
    
    // Simulation
    if (command === 'play' || command === 'pause') {
        isPlaying = (command === 'play');
        const icon = document.getElementById('play-pause-icon');
        if (icon) {
            icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }
    
    const statusEl = document.getElementById('player-status');
    if (statusEl) {
        statusEl.innerHTML = `📨 Commande "${command}" envoyée`;
        setTimeout(() => {
            statusEl.innerHTML = '✅ Connecté - Ami présent (simulation)';
        }, 1000);
    }
};

// BASCOLER PLAY/PAUSE
window.togglePlay = function() {
    isPlaying = !isPlaying;
    const icon = document.getElementById('play-pause-icon');
    if (icon) {
        icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
    window.sendCommand(isPlaying ? 'play' : 'pause');
};

// QUITTER LA SESSION
window.leaveSession = function() {
    console.log("👋 Départ de la session");
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
    
    if (window.location.pathname.includes('player.html')) {
        initPlayer();
    }
};

console.log("✅ Script chargé - Toutes les fonctions sont prêtes");
