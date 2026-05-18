/**
 * ใส่ URL Web App หลัง Deploy จาก google-apps-script/Code.gs
 * ต้องตรงกับลำดับคอลัมน์ใน Sheet (ดู SHEET_HEADERS ใน Code.gs)
 */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwq4sGrTqUfV6dX_41qd8hM0nlLCGs991dt600esFfLKisgKMzqcuLk1csDxgUySpRwBw/exec';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '1234';

/** ดัชนีคอลัมน์ให้ตรงกับ SHEET_HEADERS ใน Code.gs */
const COL = {
  checked: 0,
  status: 1,
  timestamp: 2,
  course: 5,
  prefix: 7,
  firstName: 8,
  lastName: 9,
  pdfUrl: 51
};

const FIELD_LABELS = {
  applicationDate: 'วันที่สมัคร',
  academicYear: 'ปีการศึกษา',
  course_option: 'หลักสูตร',
  field_option: 'สาขาวิชา',
  prefix: 'คำนำหน้า',
  firstName: 'ชื่อ',
  lastName: 'นามสกุล',
  nickname: 'ชื่อเล่น',
  grad_level: 'จบการศึกษาระดับ',
  gpa: 'เกรดเฉลี่ย',
  old_school: 'โรงเรียนเดิม',
  old_tambol: 'ตำบล (โรงเรียน)',
  old_amphur: 'อำเภอ (โรงเรียน)',
  old_province: 'จังหวัด (โรงเรียน)',
  disease: 'โรคประจำตัว',
  reason: 'สาเหตุที่เลือกเรียน',
  id_card: 'เลขบัตรประชาชน',
  birthdate: 'วันเกิด',
  nationality: 'สัญชาติ',
  race: 'เชื้อชาติ',
  mobile: 'เบอร์มือถือ',
  email: 'อีเมล',
  reg_houseno: 'ทะเบียนบ้าน — เลขที่',
  reg_moo: 'หมู่',
  reg_soi: 'ซอย',
  reg_road: 'ถนน',
  reg_tambol: 'ตำบล',
  reg_amphur: 'อำเภอ',
  reg_province: 'จังหวัด',
  reg_zip: 'รหัสไปรษณีย์',
  reg_phone: 'โทรศัพท์บ้าน',
  parent_name: 'ชื่อผู้ปกครอง',
  parent_lastname: 'นามสกุลผู้ปกครอง',
  parent_age: 'อายุผู้ปกครอง',
  relation: 'ความสัมพันธ์',
  parent_mobile: 'เบอร์ผู้ปกครอง',
  occupation: 'อาชีพ',
  income: 'รายได้',
  workplace: 'สถานที่ทำงาน',
  work_phone: 'เบอร์ที่ทำงาน',
  cur_houseno: 'ที่อยู่ปัจจุบัน — เลขที่',
  cur_moo: 'หมู่',
  cur_soi: 'ซอย',
  cur_road: 'ถนน',
  cur_tambol: 'ตำบล',
  cur_amphur: 'อำเภอ',
  cur_province: 'จังหวัด',
  cur_zip: 'รหัสไปรษณีย์',
  cur_phone: 'โทรศัพท์บ้าน'
};

function escapeHtml(text) {
  if (text == null || text === '') return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function showToast(message, type) {
  let el = document.getElementById('app-toast');
  if (!el) return;
  el.textContent = message;
  el.className = 'toast toast--visible' + (type === 'error' ? ' toast--error' : '');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.classList.remove('toast--visible');
  }, 4200);
}

function setupSingleCheckboxes(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach((cb) => {
    cb.addEventListener('change', function () {
      if (this.checked) {
        checkboxes.forEach((other) => {
          if (other !== this) other.checked = false;
        });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupSingleCheckboxes('course_option');
  setupSingleCheckboxes('field_option');
  setupSingleCheckboxes('grad_level');

  const dateInput = document.querySelector('input[name="applicationDate"]');
  if (dateInput && !dateInput.value) {
    dateInput.valueAsDate = new Date();
  }

  const academicYearInput = document.querySelector('input[name="academicYear"]');
  if (academicYearInput && !academicYearInput.value) {
    academicYearInput.value = new Date().getFullYear() + 543;
  }
});

function switchTab(page, btn) {
  document.querySelectorAll('.page-section').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((el) => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (btn && btn.classList) btn.classList.add('active');
}

function adminLogout() {
  document.getElementById('login-part').style.display = 'block';
  document.getElementById('data-part').style.display = 'none';
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map((cb) => cb.value)
    .join(', ');
}

function collectFormData(form) {
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    if (!data[key]) data[key] = value;
  });
  data.course_option = getCheckedValues('course_option');
  data.field_option = getCheckedValues('field_option');
  data.grad_level = getCheckedValues('grad_level');

  if (data.email_prefix) {
    data.email = data.email_prefix + '@gmail.com';
  } else {
    data.email = '';
  }
  delete data.email_prefix;

  return data;
}



function submitApplication() {
  const form = document.getElementById('appForm');
  
  // HTML5 Form Validation (เช็คว่ากรอกช่องที่มี required ครบไหม)
  if (!form.reportValidity()) {
    return;
  }

  const firstName = document.querySelector('input[name="firstName"]');
  const lastName = document.querySelector('input[name="lastName"]');
  const idCard = document.querySelector('input[name="id_card"]');

  if (idCard.value.replace(/\D/g, '').length !== 13) {
    showToast('กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก', 'error');
    idCard.focus();
    return;
  }

  const btn = document.querySelector('#page-form .btn-save');
  const originalText = btn.innerText;
  btn.innerText = 'กำลังบันทึก...';
  btn.disabled = true;

  const data = collectFormData(form);
  fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data)
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.status === 'success') {
        showToast('บันทึกข้อมูลและสร้าง PDF เรียบร้อยแล้ว');
        form.reset();
        const dateInput = document.querySelector('input[name="applicationDate"]');
        if (dateInput) dateInput.valueAsDate = new Date();
        const academicYearInput = document.querySelector('input[name="academicYear"]');
        if (academicYearInput) academicYearInput.value = new Date().getFullYear() + 543;
        return;
      }
      showToast(result.message || 'เซิร์ฟเวอร์ตอบกลับไม่สำเร็จ', 'error');
    })
    .catch((err) => {
      console.error(err);
      showToast('เชื่อมต่อ Google Apps Script ไม่ได้ — ตรวจสอบ SCRIPT_URL และ Deploy', 'error');
    })
    .finally(() => {
      btn.innerText = originalText;
      btn.disabled = false;
    });
}

function checkLogin() {
  const inputUser = document.getElementById('admin-user').value;
  const inputPass = document.getElementById('admin-pass').value;

  if (inputUser === ADMIN_USERNAME && inputPass === ADMIN_PASSWORD) {
    document.getElementById('login-part').style.display = 'none';
    document.getElementById('data-part').style.display = 'block';
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
    loadHistory();
  } else {
    showToast('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
  }
}

function formatSheetTimestamp(cell) {
  if (cell == null || cell === '') return '-';
  if (cell instanceof Date) return cell.toLocaleString('th-TH');
  const d = new Date(cell);
  return Number.isNaN(d.getTime()) ? String(cell) : d.toLocaleString('th-TH');
}

function loadHistory() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML =
    '<tr><td colspan="5" class="table-loading">กำลังโหลดข้อมูล…</td></tr>';

  fetch(SCRIPT_URL)
    .then((res) => res.json())
    .then((data) => {
      if (data && data.error) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-error">${escapeHtml(data.error)}</td></tr>`;
        return;
      }
      if (!Array.isArray(data)) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-error">รูปแบบข้อมูลไม่ถูกต้อง</td></tr>';
        return;
      }
      tbody.innerHTML = '';
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty">ยังไม่มีข้อมูลการสมัคร</td></tr>';
        return;
      }

      data.forEach((row) => {
        const statusStr = row[COL.status] || 'รอตรวจสอบ';
        const prefix = row[COL.prefix] || '';
        const name = [prefix, row[COL.firstName] || '', row[COL.lastName] || ''].join(' ').trim();
        const course = row[COL.course] || '-';
        const pdfCell = row[COL.pdfUrl]
          ? `<a class="pdf-link" href="${escapeHtml(row[COL.pdfUrl])}" target="_blank" rel="noopener">เปิด PDF</a>`
          : '—';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(statusStr)}</td>
          <td>${escapeHtml(formatSheetTimestamp(row[COL.timestamp]))}</td>
          <td>${escapeHtml(name || '-')}</td>
          <td>${escapeHtml(course)}</td>
          <td>${pdfCell}</td>`;
        tbody.appendChild(tr);
      });
    })
    .catch(() => {
      tbody.innerHTML =
        '<tr><td colspan="5" class="table-error">โหลดข้อมูลล้มเหลว — ตรวจสอบการ Deploy และ CORS</td></tr>';
    });
}
