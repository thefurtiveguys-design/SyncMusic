// ============================================
// SOUVENIR - VERSION DÉBUG
// ============================================

console.log("🚀 DÉMARRAGE DU SCRIPT");

const SUPABASE_URL = 'https://jtdhgrihatgqtphelmlx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZGhncmloYXRncXRwaGVsbWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYxNjYsImV4cCI6MjA4NzE4MjE2Nn0.ieSj9GxVykIkACfyR8DfeAAqwAUq2UM5wRjSPJ5ONhE';

const SECRET_CODE = "SOUVENIR2026";

console.log("🔌 Initialisation Supabase...");
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ Supabase initialisé");

let currentUser = null;
let allSouvenirs = [];
let currentMonth = new Date();
let selectedDate = null;
let photoFile = null;

// ============================================
// CONNEXION
// ============================================
window.checkCode = function() {
    console.log("🔑 Tentative de connexion");
    const code = document.getElementById('secret-code').value;
    console.log("Code entré:", code);
    
    if (code === SECRET_CODE) {
        console.log("✅ Code correct");
        
        currentUser = detectUser();
        console.log("Utilisateur détecté:", currentUser);
        
        document.getElementById('current-user').textContent = 
            currentUser === 'elle' ? 'C\'est toi 🌸' : 'C\'est toi ✨';
        
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('active');
        
        console.log("🔄 Chargement des souvenirs...");
        loadSouvenirs();
        
        subscribeToSouvenirs();
        adaptViewForUser();
    } else {
        alert('❌ Code secret incorrect');
    }
};

function detectUser() {
    const isMobile = window.innerWidth <= 768;
    console.log("Largeur écran:", window.innerWidth, "Mobile:", isMobile);
    return isMobile ? 'elle' : 'lui';
}

function adaptViewForUser() {
    console.log("Adaptation vue pour:", currentUser);
    if (currentUser === 'elle') {
        window.switchView('feed');
        const toggle = document.querySelector('.view-toggle');
        if (toggle) toggle.style.display = 'flex';
    } else {
        window.switchView('calendar');
        const toggle = document.querySelector('.view-toggle');
        if (toggle) toggle.style.display = 'none';
    }
}

// ============================================
// CHANGEMENT DE VUE
// ============================================
window.switchView = function(view) {
    console.log("Changement de vue vers:", view);
    
    const feedBtn = document.getElementById('view-feed-btn');
    const calBtn = document.getElementById('view-calendar-btn');
    const feedView = document.getElementById('feed-view');
    const calView = document.getElementById('calendar-view');
    
    console.log("feedView existe:", !!feedView);
    console.log("calView existe:", !!calView);
    
    if (feedBtn) feedBtn.classList.toggle('active', view === 'feed');
    if (calBtn) calBtn.classList.toggle('active', view === 'calendar');
    if (feedView) feedView.classList.toggle('active', view === 'feed');
    if (calView) calView.classList.toggle('active', view === 'calendar');
    
    if (view === 'calendar') {
        renderCalendar();
    }
};

// ============================================
// CHARGEMENT DES SOUVENIRS
// ============================================
async function loadSouvenirs() {
    console.log("📥 CHARGEMENT SOUVENIRS...");
    
    try {
        console.log("Requête Supabase...");
        const { data, error } = await supabaseClient
            .from('souvenirs')
            .select('*')
            .order('date', { ascending: false });
        
        console.log("Réponse reçue");
        
        if (error) {
            console.error("❌ Erreur Supabase:", error);
            showError("Erreur Supabase: " + error.message);
            return;
        }
        
        console.log("✅ Données reçues:", data);
        allSouvenirs = data || [];
        console.log("Nombre de souvenirs:", allSouvenirs.length);
        
        console.log("🔄 Mise à jour des vues...");
        renderFeed();
        renderCalendar();
        
    } catch (error) {
        console.error("❌ Exception:", error);
        showError("Exception: " + error.message);
    }
}

// ============================================
// AFFICHAGE DU FIL (VERSION SIMPLIFIÉE)
// ============================================
function renderFeed() {
    console.log("🎨 RENDER FEED");
    
    const feed = document.getElementById('souvenirs-feed');
    if (!feed) {
        console.error("❌ Élément #souvenirs-feed introuvable !");
        return;
    }
    
    console.log("✅ Élément feed trouvé");
    
    // Version ultra simple pour test
    let html = '<div style="background: white; padding: 20px; border-radius: 10px; margin: 20px;">';
    html += '<h3 style="color: #ff6b9d; margin-bottom: 20px;">Nos souvenirs</h3>';
    
    if (allSouvenirs.length === 0) {
        console.log("Aucun souvenir à afficher");
        html += '<p style="color: #666;">Aucun souvenir pour le moment</p>';
        html += '<button onclick="showAddSouvenir()" style="background: #ff6b9d; color: white; border: none; padding: 10px 20px; border-radius: 30px; margin-top: 15px; cursor: pointer;">➕ Ajouter un souvenir</button>';
    } else {
        console.log("Affichage de", allSouvenirs.length, "souvenirs");
        allSouvenirs.forEach(s => {
            html += `
                <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
                    <p><strong>${s.texte}</strong></p>
                    <p style="color: #888; font-size: 14px;">${s.date} ${s.emotion || '❤️'}</p>
                </div>
            `;
        });
    }
    
    html += '</div>';
    
    console.log("HTML généré, insertion...");
    feed.innerHTML = html;
    console.log("✅ Feed mis à jour");
}

// ============================================
// CALENDRIER (VERSION SIMPLIFIÉE)
// ============================================
function renderCalendar() {
    console.log("📅 RENDER CALENDAR");
    
    const calendar = document.getElementById('calendar-grid');
    if (!calendar) {
        console.error("❌ Élément #calendar-grid introuvable");
        return;
    }
    
    // Version simplifiée pour test
    let html = '<div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">';
    html += '<p style="color: #ff6b9d;">Calendrier (à venir)</p>';
    html += '<p>' + allSouvenirs.length + ' souvenirs au total</p>';
    
    if (allSouvenirs.length > 0) {
        html += '<ul style="text-align: left; margin-top: 15px;">';
        allSouvenirs.forEach(s => {
            html += `<li>${s.date}: ${s.texte}</li>`;
        });
        html += '</ul>';
    }
    
    html += '</div>';
    
    calendar.innerHTML = html;
    
    const monthTitle = document.getElementById('current-month');
    if (monthTitle) {
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        monthTitle.textContent = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    }
}

// ============================================
// AJOUT DE SOUVENIR (SIMPLIFIÉ)
// ============================================
window.showAddSouvenir = function() {
    console.log("📝 Ouverture modal");
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('souvenir-date');
    if (dateInput) dateInput.value = today;
    
    const modal = document.getElementById('souvenir-modal');
    if (modal) {
        modal.classList.remove('hidden');
        console.log("Modal ouverte");
    } else {
        console.error("Modal introuvable");
    }
};

window.hideModal = function() {
    const modal = document.getElementById('souvenir-modal');
    if (modal) modal.classList.add('hidden');
};

// ============================================
// SYNC TEMPS RÉEL
// ============================================
function subscribeToSouvenirs() {
    console.log("📡 Mise en place synchronisation temps réel");
    
    supabaseClient
        .channel('souvenirs_channel')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'souvenirs' },
            (payload) => {
                console.log("🔄 Changement détecté:", payload);
                loadSouvenirs();
            }
        )
        .subscribe();
}

// ============================================
// UTILITAIRES
// ============================================
window.logout = function() {
    console.log("🚪 Déconnexion");
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('secret-code').value = '';
};

function showError(message) {
    console.error("ERREUR:", message);
    const feed = document.getElementById('souvenirs-feed');
    if (feed) {
        feed.innerHTML = `
            <div style="background: #ffebee; color: #c62828; padding: 20px; border-radius: 10px; margin: 20px;">
                <h3>❌ Erreur</h3>
                <p>${message}</p>
                <p style="font-size: 12px;">Vérifie la console (F12)</p>
            </div>
        `;
    }
}

// ============================================
// INITIALISATION
// ============================================
window.onload = function() {
    console.log("❤️ SOUVENIR - Page chargée");
    
    // Vérifier que tous les éléments existent
    console.log("Vérification des éléments:");
    console.log("- login-screen:", document.getElementById('login-screen'));
    console.log("- app-screen:", document.getElementById('app-screen'));
    console.log("- souvenirs-feed:", document.getElementById('souvenirs-feed'));
    console.log("- calendar-grid:", document.getElementById('calendar-grid'));
    console.log("- souvenir-modal:", document.getElementById('souvenir-modal'));
};

// Gestionnaire pour la photo
document.addEventListener('DOMContentLoaded', function() {
    console.log("📸 Initialisation gestionnaire photo");
    
    const photoInput = document.getElementById('photo-input');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            console.log("Photo sélectionnée");
            const file = e.target.files[0];
            if (file) {
                photoFile = file;
                console.log("Fichier:", file.name);
            }
        });
    }
});

console.log("🏁 FIN DE L'INITIALISATION DU SCRIPT");
