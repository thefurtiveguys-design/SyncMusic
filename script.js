console.log("🚀 Démarrage");

const SUPABASE_URL = 'https://jtdhgrihatgqtphelmlx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZGhncmloYXRncXRwaGVsbWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYxNjYsImV4cCI6MjA4NzE4MjE2Nn0.ieSj9GxVykIkACfyR8DfeAAqwAUq2UM5wRjSPJ5ONhE';
const SECRET_CODE = "SOUVENIR2026";

// NE PAS utiliser "const supabase" - utiliser un nom différent
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ Supabase initialisé");

let allSouvenirs = [];
let currentMonth = new Date();
let selectedDate = null;
let photoFile = null;

// ============================================
// CONNEXION - RENDUE GLOBALE
// ============================================
window.checkCode = function() {
    console.log("🔑 Tentative de connexion");
    const code = document.getElementById('secret-code').value;
    
    if (code === SECRET_CODE) {
        console.log("✅ Code correct");
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
        document.getElementById('current-user').textContent = 'C\'est toi ✨';
        loadSouvenirs();
    } else {
        alert('❌ Code incorrect');
    }
};

// ============================================
// CHARGEMENT DES SOUVENIRS
// ============================================
async function loadSouvenirs() {
    console.log("📥 Chargement des souvenirs...");
    
    try {
        const { data, error } = await supabaseClient
            .from('souvenirs')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        console.log("✅ Souvenirs reçus:", data);
        allSouvenirs = data || [];
        renderFeed();
        renderCalendar();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        document.getElementById('souvenirs-feed').innerHTML = 
            `<p style="color: red;">Erreur: ${error.message}</p>`;
    }
}

// ============================================
// AFFICHAGE DU FIL
// ============================================
function renderFeed() {
    const feed = document.getElementById('souvenirs-feed');
    if (!feed) {
        console.error("Feed introuvable");
        return;
    }
    
    if (allSouvenirs.length === 0) {
        feed.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p>Aucun souvenir pour le moment</p>
                <button onclick="showAddSouvenir()" style="background: #ff6b9d; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 10px;">
                    + Ajouter un souvenir
                </button>
            </div>
        `;
        return;
    }
    
    feed.innerHTML = allSouvenirs.map(s => `
        <div style="background: white; border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            ${s.photo_url ? `<img src="${s.photo_url}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` : ''}
            <p style="font-size: 18px; margin: 5px 0;"><strong>${s.texte}</strong></p>
            <p style="color: #666; margin: 5px 0;">${s.date} ${s.emotion || '❤️'}</p>
            <p style="color: #ff6b9d; margin: 5px 0; font-style: italic;">${s.auteur}</p>
        </div>
    `).join('');
    
    console.log("Feed mis à jour");
}

// ============================================
// CALENDRIER SIMPLIFIÉ
// ============================================
function renderCalendar() {
    const calendar = document.getElementById('calendar-grid');
    if (!calendar) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    document.getElementById('current-month').textContent = 
        new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    let html = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;">';
    
    // En-têtes
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(day => {
        html += `<div style="text-align: center; font-weight: bold;">${day}</div>`;
    });
    
    // Jours
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    for (let i = 0; i < startDay; i++) {
        html += `<div></div>`;
    }
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        html += `<div style="aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #f0f0f0; border-radius: 5px;">${day}</div>`;
    }
    
    html += '</div>';
    calendar.innerHTML = html;
}

// ============================================
// CHANGEMENT DE VUE
// ============================================
window.switchView = function(view) {
    document.getElementById('feed-view').classList.toggle('active', view === 'feed');
    document.getElementById('calendar-view').classList.toggle('active', view === 'calendar');
};

// ============================================
// CHANGEMENT DE MOIS
// ============================================
window.changeMonth = function(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderCalendar();
};

// ============================================
// MODAL D'AJOUT
// ============================================
window.showAddSouvenir = function() {
    document.getElementById('souvenir-modal').classList.remove('hidden');
};

window.hideModal = function() {
    document.getElementById('souvenir-modal').classList.add('hidden');
};

// ============================================
// UPLOAD PHOTO
// ============================================
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
                        `<img src="${e.target.result}" style="max-width: 100%; max-height: 150px;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// ============================================
// SAUVEGARDE
// ============================================
window.saveSouvenir = async function() {
    const text = document.getElementById('souvenir-text').value;
    const date = document.getElementById('souvenir-date').value;
    const emotion = document.getElementById('souvenir-emotion').value;
    const author = document.querySelector('input[name="author"]:checked')?.value || 'nous';
    
    if (!text) {
        alert('Écris ton souvenir !');
        return;
    }
    
    try {
        let photoUrl = null;
        
        if (photoFile) {
            const fileName = `${Date.now()}_${photoFile.name}`;
            const { error: uploadError } = await supabaseClient.storage
                .from('souvenirs-photos')
                .upload(fileName, photoFile);
            
            if (!uploadError) {
                const { data: urlData } = supabaseClient.storage
                    .from('souvenirs-photos')
                    .getPublicUrl(fileName);
                photoUrl = urlData.publicUrl;
            }
        }
        
        const { error } = await supabaseClient
            .from('souvenirs')
            .insert([{ texte: text, date: date, emotion: emotion, auteur: author, photo_url: photoUrl }]);
        
        if (error) throw error;
        
        alert('✅ Souvenir ajouté !');
        hideModal();
        loadSouvenirs();
        
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
};

// ============================================
// DÉCONNEXION
// ============================================
window.logout = function() {
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('secret-code').value = '';
};

// ============================================
// INIT
// ============================================
window.onload = function() {
    console.log("❤️ SOUVENIR - Prêt");
    renderCalendar();
};

console.log("✅ Script chargé");
