/* ── Supabase Config ── */
const supabaseUrl  = "https://xmbdxpekhxjqabevkcbd.supabase.co";
const supabaseKey  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtYmR4cGVraHhqcWFiZXZrY2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3OTA5OTEsImV4cCI6MjA1NTM2Njk5MX0.YOUR_ACTUAL_ANON_KEY_HERE";
const sb = supabase.createClient(supabaseUrl, supabaseKey);

/* ── TOAST ── */
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── MOBILE SIDEBAR ── */
const menuToggle = document.querySelector('.menu-toggle');
const overlay    = document.querySelector('.sidebar-overlay');

function openSidebar()  { document.body.classList.add('sidebar-open');    menuToggle?.classList.add('open'); }
function closeSidebar() { document.body.classList.remove('sidebar-open'); menuToggle?.classList.remove('open'); }

menuToggle?.addEventListener('click', () => document.body.classList.contains('sidebar-open') ? closeSidebar() : openSidebar());
overlay?.addEventListener('click', closeSidebar);

/* ── ACTIVE SIDEBAR LINK ── */
const current = window.location.pathname.split('/').pop() || 'dashboard.html';
document.querySelectorAll('.sidebar a').forEach(a => {
  const href = a.getAttribute('href') || '';
  if (href === current || (current === '' && href === 'dashboard.html')) {
    a.classList.add('active');
  }
});

/* ─────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────── */
async function loadDashboard() {
  if (!document.getElementById('studentsCount')) return;

  try {
    const [{ data: students }, { data: payments }, { data: courses }, { data: pendingPay }] = await Promise.all([
      sb.from('students').select('*'),
      sb.from('payments').select('*'),
      sb.from('courses').select('*'),
      sb.from('payments').select('*').eq('status', 'pending'),
    ]);

    animateCount('studentsCount', students?.length ?? 0);
    animateCount('paymentsCount', pendingPay?.length ?? 0);
    animateCount('coursesCount',  courses?.length  ?? 0);

    const totalRev = payments?.filter(p => p.status === 'approved').reduce((s, p) => s + (p.amount || 999), 0) ?? 0;
    if (document.getElementById('revenueCount'))
      document.getElementById('revenueCount').textContent = 'PKR ' + totalRev.toLocaleString();

    loadActivity(students, payments);
    loadCourseBar(students, courses);

  } catch (e) { toast('Failed to load dashboard data', 'error'); }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const dur = 1000;
  const step = 16;
  const inc = target / (dur / step);
  const timer = setInterval(() => {
    start = Math.min(start + inc, target);
    el.textContent = Math.floor(start);
    if (start >= target) { el.textContent = target; clearInterval(timer); }
  }, step);
}

function loadActivity(students, payments) {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  const items = [];

  (students || []).slice(-3).reverse().forEach(s => {
    items.push({ icon: '🎓', title: `${s.name || 'New student'} enrolled`, sub: s.course || '', time: 'Recently' });
  });
  (payments || []).filter(p => p.status === 'pending').slice(0, 3).forEach(p => {
    items.push({ icon: '💳', title: `Payment from ${p.name || 'Student'}`, sub: 'Awaiting approval', time: 'Pending' });
  });

  if (!items.length) {
    feed.innerHTML = '<div class="empty-state"><div class="es-icon">📭</div><h3>No recent activity</h3></div>';
    return;
  }

  feed.innerHTML = items.map(i => `
    <div class="activity-item">
      <div class="activity-dot">${i.icon}</div>
      <div class="activity-content">
        <div class="act-title">${i.title}</div>
        <div class="act-sub">${i.sub}</div>
      </div>
      <div class="activity-time">${i.time}</div>
    </div>
  `).join('');
}

function loadCourseBar(students, courses) {
  const wrap = document.getElementById('courseBar');
  if (!wrap || !courses?.length) return;

  const counts = {};
  (students || []).forEach(s => { counts[s.course] = (counts[s.course] || 0) + 1; });
  const total = students?.length || 1;

  wrap.innerHTML = courses.map(c => {
    const count = counts[c.name] || 0;
    const pct = Math.round((count / total) * 100);
    return `
      <div class="mini-bar-item">
        <span class="mini-bar-label">${c.name || 'Course'}</span>
        <div class="mini-bar-track">
          <div class="mini-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="mini-bar-val">${count}</span>
      </div>`;
  }).join('');
}

loadDashboard();

/* ─────────────────────────────────────────────────────────
   STUDENTS
───────────────────────────────────────────────────────── */
async function loadStudents() {
  const tbody = document.getElementById('studentsTable');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5"><div class="skeleton" style="height:32px;margin:8px 0;"></div></td></tr>'.repeat(4);

  try {
    const { data: students } = await sb.from('students').select('*').order('created_at', { ascending: false });

    if (!students?.length) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="es-icon">🎓</div><h3>No students yet</h3><p>Approved students will appear here</p></div></td></tr>';
      return;
    }

    window._allStudents = students;
    renderStudentsTable(students);

  } catch (e) { toast('Failed to load students', 'error'); }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('studentsTable');
  if (!tbody) return;
  tbody.innerHTML = students.map(s => {
    const initials = (s.name || 'S').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return `
    <tr>
      <td>
        <div class="avatar-cell">
          <div class="av">${initials}</div>
          <div class="info"><div class="name">${s.name || '—'}</div><div class="sub">#${s.id}</div></div>
        </div>
      </td>
      <td class="muted">${s.email || '—'}</td>
      <td><span class="course-pill">📚 ${s.course || '—'}</span></td>
      <td>${s.phone || '—'}</td>
      <td><span class="badge-status active">Active</span></td>
    </tr>`;
  }).join('');
}

const studentsSearchInput = document.getElementById('studentsSearch');
studentsSearchInput?.addEventListener('input', () => {
  const q = studentsSearchInput.value.toLowerCase();
  const filtered = (window._allStudents || []).filter(s =>
    (s.name || '').toLowerCase().includes(q) ||
    (s.email || '').toLowerCase().includes(q) ||
    (s.course || '').toLowerCase().includes(q)
  );
  renderStudentsTable(filtered);
});

loadStudents();

/* ─────────────────────────────────────────────────────────
   PAYMENTS
───────────────────────────────────────────────────────── */
async function loadPayments(filter = 'pending') {
  const tbody = document.getElementById('paymentsTable');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7"><div class="skeleton" style="height:32px;margin:8px 0;"></div></td></tr>'.repeat(4);

  try {
    let query = sb.from('payments').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);

    const { data: payments } = await query;

    if (!payments?.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="es-icon">💳</div><h3>No ${filter} payments</h3></div></td></tr>`;
      return;
    }

    window._allPayments = payments;
    renderPaymentsTable(payments);

  } catch (e) { toast('Failed to load payments', 'error'); }
}

function renderPaymentsTable(payments) {
  const tbody = document.getElementById('paymentsTable');
  if (!tbody) return;
  tbody.innerHTML = payments.map(p => {
    const initials = (p.name || 'P').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const statusClass = { pending: 'pending', approved: 'approved', rejected: 'rejected' }[p.status] || 'pending';
    return `
    <tr>
      <td>
        <div class="avatar-cell">
          <div class="av">${initials}</div>
          <div class="info"><div class="name">${p.name || '—'}</div></div>
        </div>
      </td>
      <td class="muted">${p.email || '—'}</td>
      <td><span class="course-pill">📚 ${p.course || '—'}</span></td>
      <td class="muted">${p.method || '—'}</td>
      <td>${p.amount ? 'PKR ' + p.amount : 'PKR 999'}</td>
      <td>${p.screenshot ? `<img src="${p.screenshot}" class="screenshot-thumb" alt="screenshot" onclick="previewImg('${p.screenshot}')">` : '<span class="muted">—</span>'}</td>
      <td><span class="badge-status ${statusClass}">${p.status || 'pending'}</span></td>
      <td>
        <div class="action-group">
          ${p.status === 'pending' ? `
            <button class="btn approve sm" onclick="updatePaymentStatus(${p.id},'approved')">✅ Approve</button>
            <button class="btn reject sm" onclick="updatePaymentStatus(${p.id},'rejected')">❌ Reject</button>
          ` : `<span class="muted" style="font-size:.8rem">Done</span>`}
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function updatePaymentStatus(id, status) {
  try {
    const { data: payment } = await sb.from('payments').select('*').eq('id', id).single();

    await sb.from('payments').update({ status }).eq('id', id);

    if (status === 'approved' && payment) {
      await sb.from('students').insert([{
        name: payment.name,
        email: payment.email,
        course: payment.course,
        phone: payment.phone || '',
      }]);
    }

    toast(status === 'approved' ? 'Payment approved & student added! 🎓' : 'Payment rejected.', status === 'approved' ? 'success' : 'error');
    loadPayments(window._currentPaymentFilter || 'pending');

  } catch (e) { toast('Action failed: ' + e.message, 'error'); }
}

function previewImg(src) {
  const overlay = document.getElementById('imgPreviewOverlay');
  if (!overlay) return;
  document.getElementById('imgPreviewEl').src = src;
  overlay.classList.add('active');
}

/* tab filter */
document.querySelectorAll('.payment-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.payment-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window._currentPaymentFilter = btn.dataset.filter;
    loadPayments(btn.dataset.filter);
  });
});

loadPayments('pending');

/* ─────────────────────────────────────────────────────────
   COURSES
───────────────────────────────────────────────────────── */
async function loadCourses() {
  const tbody = document.getElementById('coursesTable');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4"><div class="skeleton" style="height:32px;margin:8px 0;"></div></td></tr>'.repeat(3);

  try {
    const { data: courses } = await sb.from('courses').select('*').order('created_at', { ascending: false });

    if (!courses?.length) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="es-icon">📚</div><h3>No courses yet</h3><p>Add your first course</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = courses.map(c => `
      <tr>
        <td><div class="avatar-cell"><div class="av" style="background:linear-gradient(135deg,#1f6bff22,#20d6c722);font-size:1.1rem;">📚</div><div class="info"><div class="name">${c.name || '—'}</div><div class="sub">${c.duration || ''}</div></div></div></td>
        <td><strong>PKR ${c.price || '999'}</strong></td>
        <td><span class="badge-status active">Active</span></td>
        <td>
          <div class="action-group">
            <button class="btn ghost sm" onclick="openEditCourse(${JSON.stringify(c).replace(/"/g,'&quot;')})">✏️ Edit</button>
            <button class="btn danger sm" onclick="deleteCourse(${c.id})">🗑</button>
          </div>
        </td>
      </tr>`).join('');

  } catch (e) { toast('Failed to load courses', 'error'); }
}

/* Add / Edit Course Modal */
function openAddCourse() {
  document.getElementById('courseModalTitle').textContent = 'Add New Course';
  document.getElementById('courseForm').reset();
  document.getElementById('courseId').value = '';
  document.getElementById('courseModal').classList.add('active');
}

function openEditCourse(course) {
  document.getElementById('courseModalTitle').textContent = 'Edit Course';
  document.getElementById('courseId').value = course.id;
  document.getElementById('courseName').value = course.name || '';
  document.getElementById('coursePrice').value = course.price || '';
  document.getElementById('courseDuration').value = course.duration || '';
  document.getElementById('courseDesc').value = course.description || '';
  document.getElementById('courseModal').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

async function saveCourse() {
  const id       = document.getElementById('courseId').value;
  const name     = document.getElementById('courseName').value.trim();
  const price    = document.getElementById('coursePrice').value.trim();
  const duration = document.getElementById('courseDuration').value.trim();
  const desc     = document.getElementById('courseDesc').value.trim();

  if (!name || !price) { toast('Course name and price are required', 'error'); return; }

  try {
    if (id) {
      await sb.from('courses').update({ name, price, duration, description: desc }).eq('id', id);
      toast('Course updated ✅', 'success');
    } else {
      await sb.from('courses').insert([{ name, price, duration, description: desc }]);
      toast('Course added 🎉', 'success');
    }
    closeModal('courseModal');
    loadCourses();
  } catch (e) { toast('Failed to save course: ' + e.message, 'error'); }
}

async function deleteCourse(id) {
  if (!confirm('Delete this course? This cannot be undone.')) return;
  try {
    await sb.from('courses').delete().eq('id', id);
    toast('Course deleted', 'info');
    loadCourses();
  } catch (e) { toast('Failed to delete course', 'error'); }
}

loadCourses();
