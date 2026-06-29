import { authService } from './auth-service.js';
import { studentService } from './studentService.js';
import { adminService } from './admin-service.js';
import { getSupabase } from './supabase-client.js';

const tableBody = document.getElementById('studentTableBody');
const searchInput = document.getElementById('searchInput');

// New Modal References
const profileModal = document.getElementById('studentProfileModal');
const profileForm = document.getElementById('profileForm');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
let studentToDelete = null;

let students = [];
let realtimeChannel = null;

async function init() {
    const user = await authService.getCurrentUser();
    if (!user) { window.location.href = 'admin-login.html'; return; }
    
    await loadInitialData();
    setupRealtime();
    console.log("Admin Students Module Loaded");
}

async function loadInitialData() {
    try {    } catch (err) {
        console.error("Courses load failed:", err);
    }
    
    try {
        // Fetch students from the new table
        students = await studentService.getAllStudents();
        renderStudents();
    } catch (err) {
        console.error("Students load failed:", err);
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 3rem; color: #ff4d4d;">Error loading students. Please check the database.</td></tr>';
    }
}

function renderStudents() {
    const searchTerm = searchInput.value.toLowerCase();

    const filtered = students.filter(s => {
        const matchesSearch = 
            (s.student_name && s.student_name.toLowerCase().includes(searchTerm)) ||
            (s.email && s.email.toLowerCase().includes(searchTerm)) ||
            (s.registration_no && s.registration_no.toLowerCase().includes(searchTerm)) ||
            (s.student_id && s.student_id.toLowerCase().includes(searchTerm));
            
        return matchesSearch;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 3rem; color: var(--color-text-dim);">No students registered yet.</td></tr>';
        return;
    }

    tableBody.innerHTML = filtered.map(s => `
        <tr>
            <td>
                <div style="font-weight: 500;">${s.student_name || 'N/A'}</div>
            </td>
            <td>${s.student_id || 'N/A'}</td>
            <td>
                <span style="font-size: 0.7rem; background: var(--color-accent-dim); color: var(--color-accent); padding: 4px 8px; border-radius: 10px; white-space: nowrap; display: inline-block;">
                    ${s.course || 'N/A'}
                </span>
            </td>
            <td>${s.mobile || 'N/A'}</td>
            <td>
                <span class="status-badge ${s.status === 'Active' ? 'status-active' : 'status-inactive'}" style="font-size: 0.8rem; padding: 4px 10px; border-radius: 20px; ${s.status === 'Active' ? 'background: rgba(40,167,69,0.1); color: #28a745;' : 'background: rgba(220,53,69,0.1); color: #dc3545;'}">
                    ${s.status || 'Active'}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-icon" title="View Details" onclick="viewStudent('${s.id}')" style="background: none; border: none; color: #00f2ff; cursor: pointer;">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" title="Edit Student" onclick="editStudent('${s.id}')" style="background: none; border: none; color: var(--color-accent); cursor: pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" title="Delete Student" onclick="deleteStudent('${s.id}')" style="background: none; border: none; color: #ff4d4d; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    const totalCountEl = document.getElementById('totalStudentsCount');
    if (totalCountEl) totalCountEl.textContent = students.length;
}

function setupRealtime() {
    realtimeChannel = studentService.subscribeToStudents((payload) => {
        console.log('Realtime update received:', payload);
        // Simplest approach: just reload all data. 
        // For larger apps, you would update the 'students' array directly.
        loadInitialData();
    });
}

// Actions
function openProfileModal(s, isEdit = false) {
    if (!s) return;
    
    // Header
    document.getElementById('profName').innerText = s.student_name || 'N/A';
    document.getElementById('profRegNo').innerText = s.registration_no || 'N/A';
    document.getElementById('profStudentId').innerText = s.student_id || 'N/A';
    const statusBadge = document.getElementById('profStatus');
    statusBadge.innerText = s.status || 'Active';
    statusBadge.className = `status-badge ${s.status === 'Active' ? 'status-active' : 'status-inactive'}`;
    statusBadge.style.background = s.status === 'Active' ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)';
    statusBadge.style.color = s.status === 'Active' ? '#28a745' : '#dc3545';
    
    // Form fields
    document.getElementById('profId').value = s.id || '';
    document.getElementById('inpName').value = s.student_name || '';
    document.getElementById('inpFather').value = s.father_name || '';
    document.getElementById('inpGender').value = s.gender || 'Male';
    document.getElementById('inpDob').value = s.dob || '';
    document.getElementById('inpMobile').value = s.mobile || '';
    document.getElementById('inpGuardianMobile').value = s.guardian_contact || '';
    document.getElementById('inpState').value = s.state || '';
    document.getElementById('inpDistrict').value = s.district || '';
    document.getElementById('inpAddress').value = s.address || '';
    
    document.getElementById('inpYear').value = s.admission_year || '';
    document.getElementById('inpCategory').value = s.course_category || '';
    document.getElementById('inpCourse').value = s.course || '';
    document.getElementById('inpDuration').value = s.course_duration || '';
    document.getElementById('inpFee').value = s.net_fee || '';
    document.getElementById('inpDoa').value = s.date_of_admission || '';
    document.getElementById('inpStatus').value = s.status || 'Active';
    
    document.getElementById('sysCreated').value = s.created_at ? new Date(s.created_at).toLocaleString() : 'N/A';
    document.getElementById('sysUpdated').value = s.updated_at ? new Date(s.updated_at).toLocaleString() : 'N/A';
    document.getElementById('sysId').value = s.id || 'N/A';
    
    setProfileEditMode(isEdit);
    
    profileModal.classList.add('active');
    profileModal.style.visibility = 'visible';
    profileModal.style.opacity = '1';
}

function setProfileEditMode(isEdit) {
    const editableFields = ['inpName', 'inpFather', 'inpDob', 'inpMobile', 'inpGuardianMobile', 'inpState', 'inpDistrict', 'inpAddress', 'inpYear', 'inpCategory', 'inpCourse', 'inpDuration', 'inpFee', 'inpDoa'];
    const selectFields = ['inpGender', 'inpStatus'];
    
    editableFields.forEach(id => {
        const el = document.getElementById(id);
        if (isEdit) el.removeAttribute('readonly');
        else el.setAttribute('readonly', 'true');
        el.style.border = isEdit ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent';
        el.style.background = isEdit ? 'rgba(255,255,255,0.05)' : 'transparent';
    });
    
    selectFields.forEach(id => {
        const el = document.getElementById(id);
        if (isEdit) el.removeAttribute('disabled');
        else el.setAttribute('disabled', 'true');
        el.style.border = isEdit ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent';
        el.style.background = isEdit ? 'rgba(255,255,255,0.05)' : 'transparent';
    });
    
    document.getElementById('editActions').style.display = isEdit ? 'flex' : 'none';
    document.getElementById('toggleEditBtn').style.display = isEdit ? 'none' : 'block';
}

function closeProfile() {
    profileModal.style.opacity = '0';
    profileModal.style.visibility = 'hidden';
    setTimeout(() => {
        profileModal.classList.remove('active');
    }, 300);
}

window.viewStudent = (id) => {
    try {
        const s = students.find(x => x.id === id);
        openProfileModal(s, false);
    } catch (e) {
        alert("View Error: " + e.message);
        console.error(e);
    }
};

window.editStudent = (id) => {
    try {
        const s = students.find(x => x.id === id);
        openProfileModal(s, true);
    } catch (e) {
        alert("Edit Error: " + e.message);
        console.error(e);
    }
};

window.deleteStudent = (id) => {
    try {
        studentToDelete = id;
        deleteConfirmModal.classList.add('active');
        deleteConfirmModal.style.visibility = 'visible';
        deleteConfirmModal.style.opacity = '1';
    } catch (e) {
        alert("Delete Error: " + e.message);
    }
};

// Event Listeners for new modals
document.getElementById('closeProfileModal').addEventListener('click', closeProfile);
document.getElementById('cancelEditBtn').addEventListener('click', () => {
    const id = document.getElementById('profId').value;
    const s = students.find(x => x.id === id);
    openProfileModal(s, false);
});
document.getElementById('toggleEditBtn').addEventListener('click', () => setProfileEditMode(true));

document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    deleteConfirmModal.style.opacity = '0';
    deleteConfirmModal.style.visibility = 'hidden';
    setTimeout(() => deleteConfirmModal.classList.remove('active'), 300);
    studentToDelete = null;
});

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!studentToDelete) return;
    try {
        const btn = document.getElementById('confirmDeleteBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
        
        await studentService.deleteStudent(studentToDelete);
        
        deleteConfirmModal.style.opacity = '0';
        deleteConfirmModal.style.visibility = 'hidden';
        setTimeout(() => deleteConfirmModal.classList.remove('active'), 300);
        studentToDelete = null;
        
        btn.innerHTML = 'Delete';
        btn.disabled = false;
        
        await loadInitialData();
    } catch (err) {
        alert("Error deleting student: " + err.message);
        document.getElementById('confirmDeleteBtn').innerHTML = 'Delete';
        document.getElementById('confirmDeleteBtn').disabled = false;
    }
});

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('profId').value;
    const btn = document.getElementById('saveProfileBtn');
    
    const formData = new FormData(profileForm);
    const updates = Object.fromEntries(formData.entries());
    
    // Convert net_fee back to numeric if possible
    if(updates.net_fee) updates.net_fee = Number(updates.net_fee);
    
    // Clean up empty strings to avoid type casting errors (especially for date fields)
    for (let key in updates) {
        if (updates[key] === '') {
            updates[key] = null;
        }
    }
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;
        
        const supabase = getSupabase();
        
        // Log the updates to console for debugging
        console.log("Attempting to update student ID:", id, "with data:", updates);
        
        const { data, error } = await supabase.from('students').update(updates).eq('id', id).select();
        
        if (error) {
            console.error("Supabase Error:", error);
            showToast("Database Error: " + (error.message || JSON.stringify(error)), 'error');
        } else if (!data || data.length === 0) {
            console.warn("Update succeeded but returned 0 rows. RLS might be blocking UPDATE.");
            showToast("Update Failed: RLS Policy blocked the operation.", 'error');
        } else {
            await loadInitialData();
            const s = students.find(x => x.id === id);
            openProfileModal(s || { id, ...updates }, false);
            showToast("Student details updated successfully!", 'success');
        }
    } catch (err) {
        console.error('Unexpected Update error:', err);
        showToast('Unexpected Error: ' + (err.message || String(err)), 'error');
    } finally {
        if (btn) {
            btn.innerHTML = 'Save Updates';
            btn.disabled = false;
        }
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProfile();
        deleteConfirmModal.style.opacity = '0';
        deleteConfirmModal.style.visibility = 'hidden';
        setTimeout(() => deleteConfirmModal.classList.remove('active'), 300);
    }
});
window.addEventListener('click', (e) => {
    if (e.target === profileModal) closeProfile();
    if (e.target === deleteConfirmModal) {
        deleteConfirmModal.style.opacity = '0';
        deleteConfirmModal.style.visibility = 'hidden';
        setTimeout(() => deleteConfirmModal.classList.remove('active'), 300);
    }
});

// Event Listeners
searchInput.addEventListener('input', renderStudents);

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        if (realtimeChannel) {
            const supabase = getSupabase();
            await supabase.removeChannel(realtimeChannel);
        }
        await authService.signOut();
        window.location.replace('admin-login.html');
    } catch (err) {
        console.error('Logout error:', err);
        window.location.replace('admin-login.html');
    }
});

// Start the module
init();
// Premium Toast Notification Function
function showToast(message, type = 'success') {
    const existing = document.getElementById('rn-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'rn-toast';
    toast.className = `rn-toast ${type}`;
    
    const icon = type === 'success' ? '<i class="fas fa-check-circle rn-toast-icon"></i>' : '<i class="fas fa-exclamation-circle rn-toast-icon"></i>';
    
    toast.innerHTML = `${icon} <div class="rn-toast-msg" style="font-weight: 500; letter-spacing: 0.5px;">${message}</div>`;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}
