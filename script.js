// ============================================
// SOUVENIR - Version finale
// ============================================

console.log("🚀 DÉMARRAGE");

const SUPABASE_URL = 'https://jtdhgrihatgqtphelmlx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZGhncmloYXRncXRwaGVsbWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYxNjYsImV4cCI6MjA4NzE4MjE2Nn0.ieSj9GxVykIkACfyR8DfeAAqwAUq2UM5wRjSPJ5ONhE';
const SECRET_CODE = "SOUVENIR2026";

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
        currentUser = window.innerWidth <= 768 ? 'elle' : 'lui';
        document.getElementById('current-user').textContent = 
            currentUser === 'elle' ? 'C\'est toi 🌸' : 'C\'est toi ✨';
        
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('active');
        
        loadSouvenirs();
        subscribeToSouvenirs();
        
        if (currentUser === 'elle') {
            window.switchView('feed');
            document.querySelector('.view-toggle').style.display = 'flex';
        } else {
            window.switchView('calendar');
            document.querySelector('.view-toggle').style.display = 'none';
        }
    } else {
        alert('❌ Code secret incorrect');
    }
};

// ============================================
// CHANGEMENT DE VUE
// ============================================
window.switchView = function(view) {
    document.getElementById('view-feed-btn')?.classList.toggle('active', view === 'feed');
    document.getElementById('view-calendar-btn')?.classList.toggle('active', view === 'calendar');
    document.getElementById('feed-view')?.classList.toggle('active', view === 'feed');
    document.getElementById('calendar-view')?.classList.toggle('active', view === 'calendar');
    
    if (view === 'calendar') renderCalendar();
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
        console.error('Erreur:', error);
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
                <i class="fas fa-heart"></i>
                <h3>Pas encore de souvenirs</h3>
                <p>Ajoutez votre premier moment</p>
                <button class="btn-primary" onclick="showAddSouvenir()" style="margin-top: 20px; width: auto; padding: 10px 30px;">
                    <i class="fas fa-plus"></i> Ajouter
                </button>
            </div>
        `;
        return;
    }
    
    feed.innerHTML = allSouvenirs.map(s => `
        <div class="souvenir-card">
            ${s.photo_url ? `<img src="${s.photo_url}" class="souvenir-photo">` : ''}
            <div class="souvenir-content">
                <div class="souvenir-header">
                    <span class="souvenir-date">${formatDate(s.date)}</span>
                    <span class="souvenir-emotion">${s.emotion || '❤️'}</span>
                </div>
                <p class="souvenir-text">${s.texte}</p>
                <div class="souvenir-author">
                    ${s.auteur === 'elle' ? '🌸 Elle' : s.auteur === 'lui' ? '✨ Lui' : '💑 Nous deux'}
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
    
    document.getElementById('current-month').textContent = 
        new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    for (let i = 0; i < startDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const hasSouvenir = allSouvenirs.some(s => s.date === dateStr);
        const isSelected = selectedDate === dateStr;
        
        html += `
            <div class="calendar-day ${hasSouvenir ? 'has-souvenir' : ''} ${isSelected ? 'selected' : ''}"
                 onclick="selectDate('${dateStr}')">
                ${day}
            </div>
        `;
    }
    
    document.getElementById('calendar-grid').innerHTML = html;
    
    if (selectedDate) showSouvenirsForDate(selectedDate);
}

window.changeMonth = function(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderCalendar();
};

window.selectDate = function(dateStr) {
    selectedDate = dateStr;
    showSouvenirsForDate(dateStr);
    renderCalendar();
};

function showSouvenirsForDate(dateStr) {
    const souvenirs = allSouvenirs.filter(s => s.date === dateStr);
    const container = document.getElementById('selected-day-souvenirs');
    if (!container) return;
    
    if (souvenirs.length === 0) {
        container.innerHTML = `
            <h4>${formatDate(dateStr)}</h4>
            <div style="text-align: center; padding: 30px;">
                <p style="color: var(--text-secondary);">Aucun souvenir ce jour-là</p>
                <button class="btn-primary" onclick="showAddSouvenirWithDate('${dateStr}')" style="margin-top: 15px; width: auto; padding: 10px 20px;">
                    <i class="fas fa-plus"></i> Ajouter
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
                    <span>${s.emotion || '❤️'}</span>
                    <span style="color: var(--accent-green);">${s.auteur === 'elle' ? '🌸' : s.auteur === 'lui' ? '✨' : '💑'}</span>
                </div>
                <p style="color: var(--text-primary);">${s.texte}</p>
                ${s.photo_url ? '<small style="color: var(--text-secondary);">📸 Photo</small>' : ''}
            </div>
        `).join('')}
    `;
}

window.showAddSouvenirWithDate = function(dateStr) {
    document.getElementById('souvenir-date').value = dateStr;
    showAddSouvenir();
};

// ============================================
// AJOUT DE SOUVENIR (CORRIGÉ)
// ============================================
window.showAddSouvenir = function() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('souvenir-date');
    if (dateInput && !dateInput.value) dateInput.value = today;
    
    // Reset photo
    photoFile = null;
    document.getElementById('photo-preview').innerHTML = `
        <i class="fas fa-camera"></i>
        <span>Ajouter une photo</span>
    `;
    
    // Reset input file
    document.getElementById('photo-input').value = '';
    
    document.getElementById('souvenir-modal').classList.remove('hidden');
};

window.hideModal = function() {
    document.getElementById('souvenir-modal').classList.add('hidden');
};

// Gestionnaire de photo - CORRIGÉ
document.addEventListener('DOMContentLoaded', function() {
    const photoInput = document.getElementById('photo-input');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                photoFile = file;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('photo-preview').innerHTML = 
                        `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

window.saveSouvenir = async function() {
    const text = document.getElementById('souvenir-text').value;
    const date = document.getElementById('souvenir-date').value;
    const emotion = document.getElementById('souvenir-emotion').value;
    const author = document.querySelector('input[name="author"]:checked')?.value || 'nous';
    
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
            console.log("Upload photo:", photoFile.name);
            const fileName = `${Date.now()}_${photoFile.name}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('souvenirs-photos')
                .upload(fileName, photoFile);
            
            if (uploadError) {
                console.error("Erreur upload:", uploadError);
                alert("Erreur upload photo: " + uploadError.message);
                return;
            }
            
            const { data: urlData } = supabaseClient.storage
                .from('souvenirs-photos')
                .getPublicUrl(fileName);
            
            photoUrl = urlData.publicUrl;
            console.log("Photo uploadée:", photoUrl);
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
        document.getElementById('souvenir-text').value = '';
        document.getElementById('photo-input').value = '';
        photoFile = null;
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur : ' + error.message);
    }
};

// ============================================
// SYNCHRONISATION
// ============================================
function subscribeToSouvenirs() {
    supabaseClient
        .channel('souvenirs_channel')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'souvenirs' },
            () => loadSouvenirs()
        )
        .subscribe();
}

// ============================================
// UTILITAIRES
// ============================================
function formatDate(dateStr) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}

window.logout = function() {
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('secret-code').value = '';
};

// ============================================
// INITIALISATION
// ============================================
window.onload = function() {
    console.log("❤️ SOUVENIR - Prêt");
};
