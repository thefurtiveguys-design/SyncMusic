console.log("Démarrage");
const SUPABASE_URL = 'https://jtdhgrihatgqtphelmlx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZGhncmloYXRncXRwaGVsbWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYxNjYsImV4cCI6MjA4NzE4MjE2Nn0.ieSj9GxVykIkACfyR8DfeAAqwAUq2UM5wRjSPJ5ONhE';
const SECRET_CODE = "SOUVENIR2026";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allSouvenirs = [];
let currentMonth = new Date();
let selectedDate = null;
let photoFile = null;

window.checkCode = function() {
    if (document.getElementById('secret-code').value === SECRET_CODE) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
        document.getElementById('current-user').textContent = 'C\'est toi ✨';
        loadSouvenirs();
        subscribe();
    } else alert('Code incorrect');
};

async function loadSouvenirs() {
    const { data, error } = await supabase.from('souvenirs').select('*').order('date', { ascending: false });
    if (error) console.error(error);
    else {
        allSouvenirs = data;
        renderFeed();
        renderCalendar();
    }
}

function renderFeed() {
    const feed = document.getElementById('souvenirs-feed');
    if (!feed) return;
    if (allSouvenirs.length === 0) {
        feed.innerHTML = '<p>Aucun souvenir. Ajoutez-en un !</p>';
        return;
    }
    feed.innerHTML = allSouvenirs.map(s => `
        <div class="souvenir-card">
            ${s.photo_url ? `<img src="${s.photo_url}" class="souvenir-photo">` : ''}
            <p><strong>${s.texte}</strong></p>
            <p>${s.date} ${s.emotion || '❤️'}</p>
            <small>${s.auteur}</small>
        </div>
    `).join('');
}

function renderCalendar() { /* simplifié */ }

window.switchView = function(view) { /* à implémenter */ };
window.showAddSouvenir = function() { document.getElementById('souvenir-modal').classList.remove('hidden'); };
window.hideModal = function() { document.getElementById('souvenir-modal').classList.add('hidden'); };
window.saveSouvenir = async function() { /* à implémenter avec upload */ };
window.logout = function() { /* à implémenter */ };

console.log("Prêt");
