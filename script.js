// ============================================
// SOUVENIR - Script principal CORRIGÉ
// ============================================

// CONFIGURATION SUPABASE (TES CLÉS)
const SUPABASE_URL = 'https://jtdhgrihatgqtphelmlx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZGhncmloYXRncXRwaGVsbWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYxNjYsImV4cCI6MjA4NzE4MjE2Nn0.ieSj9GxVykIkACfyR8DfeAAqwAUq2UM5wRjSPJ5ONhE';

// CODE SECRET (Change-le si tu veux)
const SECRET_CODE = "SOUVENIR2026";

// Initialisation Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let currentUser = null;
let allSouvenirs = [];
let currentMonth = new Date();
let selectedDate = null;
let photoFile = null;

// ============================================
// CONNEXION
// ============================================
window.checkCode = function() {
    const code = document.getElementById('secret-code').value;
    
    if (code === SECRET_CODE) {
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

function detectUser() {
    const isMobile = window.innerWidth <= 768;
    return isMobile ? 'elle' : 'lui';
}

function adaptViewForUser() {
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
    const feedBtn = document.getElementById('view-feed-btn');
    const calBtn = document.getElementById('view-calendar-btn');
    const feedView = document.getElementById('feed-view');
    const calView = document.getElementById('calendar-view');
    
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
    console.log("Chargement des souvenirs...");
    
    try {
        const { data, error } = await supabaseClient
            .from('souvenirs')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        console.log("Souvenirs chargés:", data);
        allSouvenirs = data || [];
        
        // Mettre à jour les deux vues
        renderFeed();
        renderCalendar();
        
    } catch (error) {
        console.error('Erreur chargement:', error);
        showError("Impossible de charger les souvenirs");
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
            <div class="empty-state">
                <i class="fas fa-heart" style="font-size: 60px; color: #ff6b9d; margin-bottom: 20px;"></i>
                <h3>Pas encore de souvenirs</h3>
                <p>Ajoutez votre premier moment en cliquant sur</p>
                <p style="font-size: 40px; margin: 20px 0;">⬇️</p>
                <button class="btn-primary" onclick="showAddSouvenir()" style="width: auto; padding: 15px 30px;">
                    <i class="fas fa-plus-circle"></i> Nouveau souvenir
                </button>
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
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    
    // En-têtes
    const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Cases vides
    for (let i = 0; i < startDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const hasSouvenir = allSouvenirs.some(s => s.date === dateStr);
        const isSelected = selectedDate === dateStr;
        
        html += `
            <div class="calendar-day ${hasSouvenir ? 'has-souvenir' : ''} ${isSelected ? 'selected' : ''}"
                 onclick="selectDate('${dateStr}')">
                ${day}
                ${hasSouvenir ? '<span style="font-size: 8px; display: block;">❤️</span>' : ''}
            </div>
        `;
    }
    
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
        calendarGrid.innerHTML = html;
    }
}

window.changeMonth = function(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderCalendar();
};

window.selectDate = function(dateStr) {
    selectedDate = dateStr;
    showSouvenirsForDate(dateStr);
    
    // Highlight visuel
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
};

function showSouvenirsForDate(dateStr) {
    const souvenirs = allSouvenirs.filter(s => s.date === dateStr);
    const container = document.getElementById('selected-day-souvenirs');
    if (!container) return;
    
    if (souvenirs.length === 0) {
        container.innerHTML = `
            <h4>${formatDate(dateStr)}</h4>
            <div style="text-align: center; padding: 30px;">
                <p style="color: #888;">Aucun souvenir ce jour-là</p>
                <button class="btn-primary" onclick="showAddSouvenirWithDate('${dateStr}')" style="margin-top: 15px; width: auto;">
                    <i class="fas fa-plus"></i> Ajouter un souvenir
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <h4>${formatDate(dateStr)}</h4>
        ${souvenirs.map(s => `
            <div class="souvenir-mini-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-size: 20px;">${s.emotion || '❤️'}</span>
                    <small style="color: #ff6b9d;">${s.auteur === 'elle' ? '🌸' : s.auteur === 'lui' ? '✨' : '💑'}</small>
                </div>
                <p style="margin: 5px 0;">${s.texte}</p>
                ${s.photo_url ? '<small>📸 Photo</small>' : ''}
            </div>
        `).join('')}
    `;
}

window.showAddSouvenirWithDate = function(dateStr) {
    document.getElementById('souvenir-date').value = dateStr;
    showAddSouvenir();
};

// ============================================
// AJOUT DE SOUVENIR
// ============================================
window.showAddSouvenir = function() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('souvenir-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = today;
    }
    
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
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('photo-preview');
                    if (preview) {
                        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
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
    
    if (!date) {
        alert('Choisis une date !');
        return;
    }
    
    try {
        let photoUrl = null;
        
        // Upload photo si existante
        if (photoFile) {
            const fileName = `${Date.now()}_${photoFile.name}`;
            const { error } = await supabaseClient.storage
                .from('souvenirs-photos')
                .upload(fileName, photoFile);
            
            if (error) {
                console.error("Erreur upload:", error);
            } else {
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
        
        alert('✅ Souvenir ajouté !');
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
                loadSouvenirs();
                showNotification();
            }
        )
        .subscribe();
}

function showNotification() {
    if (document.hidden) {
        document.title = '❤️ Nouveau souvenir !';
        setTimeout(() => {
            document.title = 'SOUVENIR';
        }, 2000);
    }
}

// ============================================
// UTILITAIRES
// ============================================
function formatDate(dateStr) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', options);
}

window.logout = function() {
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('secret-code').value = '';
};

function showError(message) {
    const feed = document.getElementById('souvenirs-feed');
    if (feed) {
        feed.innerHTML = `
            <div class="empty-state" style="color: #ff4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 40px;"></i>
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
    console.log('❤️ SOUVENIR - Prêt');
};

// Adaptation au resize
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
