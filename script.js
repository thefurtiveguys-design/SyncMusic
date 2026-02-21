// ============================================
// SOUVENIR - Script principal CORRIGÉ
// ============================================

// CONFIGURATION SUPABASE (TES CLÉS)
const SUPABASE_URL = 'https://jtdhgrihatgqtphelmlx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZGhncmloYXRncXRwaGVsbWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYxNjYsImV4cCI6MjA4NzE4MjE2Nn0.ieSj9GxVykIkACfyR8DfeAAqwAUq2UM5wRjSPJ5ONhE';

// CODE SECRET (À CHANGER - celui que tu veux)
const SECRET_CODE = "SOUVENIR2026"; // Change-le !

// Initialisation Supabase - SANS redéclarer "supabase"
// On utilise un nom différent pour éviter le conflit
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let currentUser = null;
let allSouvenirs = [];
let currentMonth = new Date();
let selectedDate = null;
let photoFile = null;

// ============================================
// CONNEXION - RENDUE GLOBALE
// ============================================
window.checkCode = function() {
    const code = document.getElementById('secret-code').value;
    
    if (code === SECRET_CODE) {
        // Code bon - on connecte
        currentUser = detectUser();
        document.getElementById('current-user').textContent = 
            currentUser === 'elle' ? 'C\'est toi 🌸' : 'C\'est toi ✨';
        
        // Afficher l'app
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('active');
        
        // Charger les souvenirs
        loadSouvenirs();
        
        // Synchronisation en temps réel
        subscribeToSouvenirs();
        
        // Adapter la vue selon l'utilisateur
        adaptViewForUser();
    } else {
        alert('❌ Code secret incorrect');
    }
};

// Détecter si c'est elle (mobile) ou lui (ordinateur)
function detectUser() {
    const isMobile = window.innerWidth <= 768;
    // Sur mobile => elle, sur ordi => lui
    return isMobile ? 'elle' : 'lui';
}

// Adapter la vue selon l'utilisateur
function adaptViewForUser() {
    if (currentUser === 'elle') {
        // Elle voit le fil par défaut
        window.switchView('feed');
        const toggle = document.querySelector('.view-toggle');
        if (toggle) toggle.style.display = 'flex';
    } else {
        // Lui voit le calendrier par défaut
        window.switchView('calendar');
        const toggle = document.querySelector('.view-toggle');
        if (toggle) toggle.style.display = 'none';
    }
}

// ============================================
// CHANGEMENT DE VUE - RENDU GLOBAL
// ============================================
window.switchView = function(view) {
    // Mettre à jour les boutons
    const feedBtn = document.getElementById('view-feed-btn');
    const calBtn = document.getElementById('view-calendar-btn');
    
    if (feedBtn) feedBtn.classList.toggle('active', view === 'feed');
    if (calBtn) calBtn.classList.toggle('active', view === 'calendar');
    
    // Afficher la bonne vue
    const feedView = document.getElementById('feed-view');
    const calView = document.getElementById('calendar-view');
    
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
    try {
        const { data, error } = await supabaseClient
            .from('souvenirs')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        allSouvenirs = data || [];
        renderFeed();
        renderCalendar();
        
    } catch (error) {
        console.error('Erreur chargement:', error);
        const feed = document.getElementById('souvenirs-feed');
        if (feed) {
            feed.innerHTML = '<div class="loading">Erreur de chargement</div>';
        }
    }
}

// ============================================
// AFFICHAGE DU FIL
// ============================================
function renderFeed() {
    const feed = document.getElementById('souvenirs-feed');
    if (!feed) return;
    
    if (allSouvenirs.length === 0) {
        feed.innerHTML = `
            <div class="loading">
                <i class="fas fa-heart" style="font-size: 40px; color: #ff6b9d; margin-bottom: 20px;"></i>
                <p>Pas encore de souvenirs</p>
                <p style="font-size: 14px;">Ajoutez votre premier moment ❤️</p>
            </div>
        `;
        return;
    }
    
    feed.innerHTML = allSouvenirs.map(souvenir => `
        <div class="souvenir-card">
            ${souvenir.photo_url ? `
                <img src="${souvenir.photo_url}" class="souvenir-photo" alt="Souvenir">
            ` : ''}
            <div class="souvenir-content">
                <div class="souvenir-header">
                    <span class="souvenir-date">${formatDate(souvenir.date)}</span>
                    <span class="souvenir-emotion">${souvenir.emotion || '❤️'}</span>
                </div>
                <p class="souvenir-text">${souvenir.texte}</p>
                <div class="souvenir-author">
                    ${souvenir.auteur === 'elle' ? '🌸 Elle' : 
                      souvenir.auteur === 'lui' ? '✨ Lui' : '💑 Nous deux'}
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// CALENDRIER
// ============================================
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Mettre à jour le titre
    const monthTitle = document.getElementById('current-month');
    if (monthTitle) {
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        monthTitle.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // 0 = dimanche, 1 = lundi...
    
    // Convertir pour commencer le lundi
    let startOffset = startDay === 0 ? 6 : startDay - 1;
    
    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Générer la grille
    let html = '';
    
    // En-têtes des jours
    const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Cases vides avant le premier jour
    for (let i = 0; i < startOffset; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const hasSouvenir = allSouvenirs.some(s => s.date === dateStr);
        const isSelected = selectedDate === dateStr;
        
        html += `
            <div class="calendar-day ${hasSouvenir ? 'has-souvenir' : ''} ${isSelected ? 'selected' : ''}"
                 onclick="window.selectDate('${dateStr}')">
                ${day}
            </div>
        `;
    }
    
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
        calendarGrid.innerHTML = html;
    }
    
    // Si une date est sélectionnée, afficher ses souvenirs
    if (selectedDate) {
        showSouvenirsForDate(selectedDate);
    }
}

window.changeMonth = function(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderCalendar();
};

window.selectDate = function(dateStr) {
    selectedDate = dateStr;
    showSouvenirsForDate(dateStr);
    renderCalendar(); // Pour mettre à jour la classe selected
};

function showSouvenirsForDate(dateStr) {
    const souvenirs = allSouvenirs.filter(s => s.date === dateStr);
    const container = document.getElementById('selected-day-souvenirs');
    if (!container) return;
    
    if (souvenirs.length === 0) {
        container.innerHTML = `
            <h4>${formatDate(dateStr)}</h4>
            <p style="color: #888; text-align: center; padding: 20px;">
                Aucun souvenir ce jour-là
            </p>
        `;
        return;
    }
    
    container.innerHTML = `
        <h4>${formatDate(dateStr)}</h4>
        ${souvenirs.map(s => `
            <div class="souvenir-mini-card">
                <div style="display: flex; justify-content: space-between;">
                    <span>${s.emotion || '❤️'}</span>
                    <small>${s.auteur === 'elle' ? '🌸' : s.auteur === 'lui' ? '✨' : '💑'}</small>
                </div>
                <p>${s.texte}</p>
            </div>
        `).join('')}
    `;
}

// ============================================
// AJOUT DE SOUVENIR - RENDU GLOBAL
// ============================================
window.showAddSouvenir = function() {
    // Mettre la date du jour par défaut
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('souvenir-date');
    if (dateInput) dateInput.value = today;
    
    // Reset photo
    photoFile = null;
    const preview = document.getElementById('photo-preview');
    if (preview) {
        preview.innerHTML = `
            <i class="fas fa-camera"></i>
            <span>Ajouter une photo</span>
        `;
    }
    
    const modal = document.getElementById('souvenir-modal');
    if (modal) modal.classList.remove('hidden');
};

window.hideModal = function() {
    const modal = document.getElementById('souvenir-modal');
    if (modal) modal.classList.add('hidden');
};

// Gestion de la photo
document.addEventListener('DOMContentLoaded', function() {
    const photoInput = document.getElementById('photo-input');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                photoFile = file;
                
                // Aperçu
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('photo-preview');
                    if (preview) {
                        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px;">`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

window.saveSouvenir = async function() {
    const text = document.getElementById('souvenir-text')?.value;
    const date = document.getElementById('souvenir-date')?.value;
    const emotion = document.getElementById('souvenir-emotion')?.value;
    const authorRadio = document.querySelector('input[name="author"]:checked');
    const author = authorRadio ? authorRadio.value : 'nous';
    
    if (!text) {
        alert('Écris ton souvenir !');
        return;
    }
    
    try {
        let photoUrl = null;
        
        // Upload photo si existante
        if (photoFile) {
            const fileName = `${Date.now()}_${photoFile.name}`;
            const { data, error } = await supabaseClient.storage
                .from('souvenirs-photos')
                .upload(fileName, photoFile);
            
            if (!error) {
                const { data: urlData } = supabaseClient.storage
                    .from('souvenirs-photos')
                    .getPublicUrl(fileName);
                photoUrl = urlData.publicUrl;
            }
        }
        
        // Sauvegarder le souvenir
        const { error } = await supabaseClient
            .from('souvenirs')
            .insert([{
                texte: text,
                date: date,
                emotion: emotion,
                auteur: author,
                photo_url: photoUrl
            }]);
        
        if (error) throw error;
        
        window.hideModal();
        
        // Reset form
        if (document.getElementById('souvenir-text')) {
            document.getElementById('souvenir-text').value = '';
        }
        
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        alert('Erreur : ' + error.message);
    }
};

// ============================================
// SYNCHRONISATION EN TEMPS RÉEL
// ============================================
function subscribeToSouvenirs() {
    supabaseClient
        .channel('souvenirs_channel')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'souvenirs' },
            () => {
                // Recharger les souvenirs
                loadSouvenirs();
                
                // Notification subtile
                if (document.hidden) {
                    document.title = '❤️ Nouveau souvenir !';
                    setTimeout(() => {
                        document.title = 'SOUVENIR';
                    }, 2000);
                }
            }
        )
        .subscribe();
}

// ============================================
// UTILITAIRES
// ============================================
function formatDate(dateStr) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', options);
}

window.logout = function() {
    localStorage.clear();
    const appScreen = document.getElementById('app-screen');
    const loginScreen = document.getElementById('login-screen');
    
    if (appScreen) {
        appScreen.classList.remove('active');
        appScreen.classList.add('hidden');
    }
    if (loginScreen) {
        loginScreen.classList.add('active');
    }
    
    const codeInput = document.getElementById('secret-code');
    if (codeInput) codeInput.value = '';
};

// ============================================
// INITIALISATION
// ============================================
window.onload = function() {
    console.log('❤️ SOUVENIR - Prêt');
};

// Adaptation au resize (pour détecter mobile/ordi)
window.addEventListener('resize', () => {
    if (document.getElementById('app-screen')?.classList.contains('active')) {
        const newUser = detectUser();
        if (newUser !== currentUser) {
            currentUser = newUser;
            const userEl = document.getElementById('current-user');
            if (userEl) {
                userEl.textContent = currentUser === 'elle' ? 'C\'est toi 🌸' : 'C\'est toi ✨';
            }
            adaptViewForUser();
        }
    }
});
