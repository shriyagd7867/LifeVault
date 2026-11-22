const sampleDocs = [
    { name: 'Passport', category: 'Identity', added: '12 Nov 2026', expiry: '18/08/2028' },
    { name: 'Aadhaar Card', category: 'Identity', added: '08 Nov 2026', expiry: '' },
    { name: 'College ID Card', category: 'Education', added: '02 Nov 2026', expiry: '30/06/2027' },
    { name: 'Health Insurance', category: 'Personal', added: '28 Oct 2026', expiry: '15/12/2026' },
    { name: 'Bank Account Details', category: 'Finance', added: '21 Oct 2026', expiry: '' },
    { name: 'Driving Licence', category: 'Identity', added: '14 Oct 2026', expiry: '09/01/2027' },
    { name: 'Academic Transcript', category: 'Education', added: '10 Oct 2026', expiry: '' },
    { name: 'Birth Certificate', category: 'Personal', added: '05 Oct 2026', expiry: '' }
];

const defaultFamily = [
    { name: 'Mom', role: 'Can view selected files', access: 'View access' },
    { name: 'Dad', role: 'Can view selected files', access: 'View access' },
    { name: 'Brother', role: 'Limited access', access: 'Selected files' }
];

let savedUser = null;
try {
    savedUser = JSON.parse(localStorage.getItem('lifevault_user') || 'null');
} catch (err) {
    savedUser = null;
}

const isCustomAccount = Boolean(
    savedUser &&
    savedUser.name &&
    savedUser.email &&
    savedUser.email.trim().toLowerCase() !== 'shriya'
);

const userName = (savedUser && savedUser.name && savedUser.name.trim()) || 'Shriya';
const userInitial = userName.charAt(0).toUpperCase() || 'S';
const userKeyPart = isCustomAccount ? savedUser.email.trim().toLowerCase() : 'demo';
const docStorageKey = `lifevault_docs_${userKeyPart}`;
const familyStorageKey = `lifevault_family_${userKeyPart}`;

let docs = [];
const storedDocs = localStorage.getItem(docStorageKey);
if (storedDocs !== null) {
    try {
        docs = JSON.parse(storedDocs);
    } catch (err) {
        docs = isCustomAccount ? [] : [...sampleDocs];
    }
} else {
    docs = isCustomAccount ? [] : [...sampleDocs];
    localStorage.setItem(docStorageKey, JSON.stringify(docs));
}

let family = [];
const storedFamily = localStorage.getItem(familyStorageKey);
if (storedFamily !== null) {
    try {
        family = JSON.parse(storedFamily);
    } catch (err) {
        family = isCustomAccount ? [] : [...defaultFamily];
    }
} else {
    family = isCustomAccount ? [] : [...defaultFamily];
    localStorage.setItem(familyStorageKey, JSON.stringify(family));
}

function saveDocs() {
    localStorage.setItem(docStorageKey, JSON.stringify(docs));
}

function saveFamily() {
    localStorage.setItem(familyStorageKey, JSON.stringify(family));
}

let filter = 'All';
const $ = id => document.getElementById(id);

$('sidebar-name').textContent = userName;
$('sidebar-avatar').textContent = userInitial;
$('topbar-avatar').textContent = userInitial;
$('welcome-greeting').textContent = `Good to see you, ${userName}. Here's your vault at a glance.`;
$('settings-account').textContent = `${userName} · Personal workspace`;

$('date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
});

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function showToast(msg) {
    $('toast').textContent = msg;
    $('toast').classList.add('show');
    setTimeout(() => $('toast').classList.remove('show'), 2400);
}

// Parses DD/MM/YYYY or legacy YYYY-MM-DD into a valid Date object (at local midnight) or null
function parseDate(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    let day, month, year;
    let match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
        day = Number(match[1]);
        month = Number(match[2]);
        year = Number(match[3]);
    } else {
        match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
        return null;
    }
    return dt;
}

function formatDDMMYYYY(dt) {
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function status(dateStr) {
    if (!dateStr) return { label: 'No expiry', cls: '' };
    const dt = parseDate(dateStr);
    if (!dt) return { label: 'Invalid date', cls: 'expired' };
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.ceil((dt - todayMidnight) / 86400000);
    if (days < 0) return { label: 'Expired', cls: 'expired' };
    if (days <= 60) return { label: days + ' days left', cls: 'soon' };
    return { label: 'Valid', cls: '' };
}

function docRow(d) {
    const s = status(d.expiry);
    return `<div class="doc-row"><div class="file-icon">▤</div><div><div class="doc-name">${esc(d.name)}</div><div class="doc-meta">${esc(d.category)} · Added ${esc(d.added)}</div></div><span class="status ${s.cls}">${s.label}</span></div>`;
}

function reminder(d) {
    const dt = parseDate(d.expiry);
    if (!dt) return '';
    return `<div class="reminder"><div class="reminder-date">${dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}<b>${dt.getDate()}</b></div><div><strong>${esc(d.name)}</strong><small>${status(d.expiry).label} · ${formatDDMMYYYY(dt)}</small></div></div>`;
}

function renderFamily() {
    $('family-count').textContent = String(family.length).padStart(2, '0');
    if (!family.length) {
        $('family-list').innerHTML = '<div class="empty">No family members added yet. Click "+ Add family member" to choose who has access.</div>';
        return;
    }
    $('family-list').innerHTML = family.map((m, idx) => {
        const initial = (m.name || '?').trim().charAt(0).toUpperCase() || '?';
        return `<article class="card person">
      <div class="person-top">
        <div class="avatar">${esc(initial)}</div>
        <button type="button" class="remove-btn" data-remove-family="${idx}" title="Remove member">Remove</button>
      </div>
      <h3>${esc(m.name)}</h3>
      <p class="muted">${esc(m.role)}</p>
      <span class="tag">${esc(m.access)}</span>
    </article>`;
    }).join('');

    document.querySelectorAll('[data-remove-family]').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = Number(btn.dataset.removeFamily);
            family.splice(index, 1);
            saveFamily();
            renderFamily();
            showToast('Family member removed.');
        });
    });
}

function render() {
    const q = ($('search')?.value || '').toLowerCase();
    const list = docs.filter(d =>
        (filter === 'All' || d.category === filter) &&
        (!q || (d.name + ' ' + d.category).toLowerCase().includes(q))
    );

    $('recent-list').innerHTML = list.slice(0, 5).map(docRow).join('') || '<div class="empty">No documents yet. Click "+ Add a document" to add one.</div>';
    $('all-list').innerHTML =
        '<div class="table-row table-head"><span>Document</span><span>Category</span><span>Added</span><span>Status</span></div>' +
        (docs.map(d => {
            const s = status(d.expiry);
            return `<div class="table-row"><b>${esc(d.name)}</b><span>${esc(d.category)}</span><span>${esc(d.added)}</span><span class="status ${s.cls}">${s.label}</span></div>`;
        }).join('') || '<div class="empty">No documents added yet.</div>');

    const upcoming = docs
        .map(d => ({ doc: d, dt: parseDate(d.expiry) }))
        .filter(item => item.dt && status(item.doc.expiry).cls !== 'expired')
        .sort((a, b) => a.dt - b.dt)
        .map(item => item.doc);

    $('reminder-list').innerHTML = upcoming.slice(0, 3).map(reminder).join('') || '<div class="empty">No upcoming expiries.</div>';
    $('all-reminders').innerHTML = upcoming.map(reminder).join('') || '<div class="empty">No upcoming expiries.</div>';
    $('total').textContent = String(docs.length).padStart(2, '0');
    $('soon').textContent = String(docs.filter(d => d.expiry && status(d.expiry).cls === 'soon').length).padStart(2, '0');
    renderFamily();
}

function go(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    $(id).classList.add('active');
    document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.dataset.page === id));
}

document.querySelectorAll('.nav').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => go(b.dataset.goto)));
document.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    document.querySelectorAll('.chip').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    render();
}));

$('search').addEventListener('input', render);

function openModal() { $('modal').classList.add('show'); }
function closeModal() { $('modal').classList.remove('show'); }

$('open-add').addEventListener('click', openModal);
$('open-add-2').addEventListener('click', openModal);
$('cancel').addEventListener('click', closeModal);
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });

$('doc-expiry').addEventListener('input', e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    e.target.value = formatted;
});

$('document-form').addEventListener('submit', e => {
    e.preventDefault();
    const rawExpiry = $('doc-expiry').value.trim();
    let normalizedExpiry = '';
    if (rawExpiry) {
        const parsed = parseDate(rawExpiry);
        if (!parsed) {
            showToast('Please enter a valid date in DD/MM/YYYY format.');
            $('doc-expiry').focus();
            return;
        }
        normalizedExpiry = formatDDMMYYYY(parsed);
    }

    const file = $('doc-file').files[0];
    docs.unshift({
        name: $('doc-name').value.trim(),
        category: $('doc-category').value,
        added: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        expiry: normalizedExpiry
    });
    saveDocs();
    e.target.reset();
    closeModal();
    render();
    showToast(file ? 'Record added. The selected file is not uploaded.' : 'Document record added.');
});

function openFamilyModal() { $('family-modal').classList.add('show'); }
function closeFamilyModal() { $('family-modal').classList.remove('show'); }

$('open-add-family').addEventListener('click', openFamilyModal);
$('cancel-family').addEventListener('click', closeFamilyModal);
$('family-modal').addEventListener('click', e => { if (e.target === $('family-modal')) closeFamilyModal(); });

$('family-form').addEventListener('submit', e => {
    e.preventDefault();
    family.push({
        name: $('fam-name').value.trim(),
        role: $('fam-role').value.trim(),
        access: $('fam-access').value
    });
    saveFamily();
    e.target.reset();
    closeFamilyModal();
    renderFamily();
    showToast('Family member added.');
});

render();