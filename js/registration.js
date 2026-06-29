import { studentService } from './studentService.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('courseRegisterForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            // Loading state
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(registerForm);
                const data = Object.fromEntries(formData.entries());
                
                // Map the form data to match our students table schema
                const studentData = {
                    admission_year: data.asession || '',
                    student_name: data.name || '',
                    father_name: data.father || '',
                    gender: data.gender || '',
                    dob: data.dob || null,
                    mobile: data.contact || '',
                    guardian_contact: data.guardian_contact || '',
                    state: data.state || '',
                    district: data.district || '',
                    address: data.address || '',
                    course_category: data.program ? document.querySelector('#program option:checked').text : '',
                    course: data.courses || '',
                    course_duration: data.duration || '',
                    net_fee: data.fee ? parseFloat(data.fee) : null,
                    date_of_admission: data.doj || null
                };

                // Register student
                const newStudent = await studentService.registerStudent(studentData);
                
                // Show success popup
                showSuccessPopup(newStudent.registration_no, newStudent.student_id);
                
                // Clear the form
                registerForm.reset();
                
            } catch (error) {
                console.error('Error submitting registration:', error);
                showErrorPopup(error.message || 'An error occurred during registration. Please try again.');
            } finally {
                // Restore button state
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});

function showErrorPopup(message) {
    let popup = document.getElementById('registrationErrorPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'registrationErrorPopup';
        popup.className = 'modal-overlay';
        popup.innerHTML = `
            <div class="modal-content text-center" style="max-width: 400px; background: var(--color-bg-card); border: 1px solid #ff4d4d; border-radius: 12px; padding: 2.5rem; text-align: center; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff4d4d; margin-bottom: 1.5rem;"></i>
                <h2 style="margin-bottom: 1rem; color: #fff;">Submission Failed</h2>
                <div style="background: rgba(255,0,0,0.05); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                    <p id="errorPopupMessage" style="color: var(--color-text-dim); font-size: 1rem; margin-bottom: 0;">${message}</p>
                </div>
                <button class="btn btn-outline w-100" id="closeErrorPopup" style="border-color: #ff4d4d; color: #ff4d4d;">Close</button>
            </div>
        `;
        document.body.appendChild(popup);
        
        document.getElementById('closeErrorPopup').addEventListener('click', () => {
            popup.style.opacity = '0';
            popup.style.visibility = 'hidden';
        });
    } else {
        document.getElementById('errorPopupMessage').textContent = message;
    }
    
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    popup.style.display = 'flex';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.style.zIndex = '9999';
    popup.style.opacity = '0';
    popup.style.visibility = 'hidden';
    popup.style.transition = 'all 0.3s ease';

    setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.visibility = 'visible';
    }, 10);
}

function showSuccessPopup(registrationNo, studentId) {
    // Check if popup already exists, if not create it
    let popup = document.getElementById('registrationSuccessPopup');
    
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'registrationSuccessPopup';
        popup.className = 'modal-overlay'; // Reusing global modal classes if possible, or custom
        popup.innerHTML = `
            <div class="modal-content text-center" style="max-width: 400px; background: var(--color-bg-card); border: 1px solid var(--color-accent); border-radius: 12px; padding: 2.5rem; text-align: center; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: #00ff00; margin-bottom: 1.5rem;"></i>
                <h2 style="margin-bottom: 1rem; color: #fff;">Registration Successful</h2>
                <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                    <p style="color: var(--color-text-dim); font-size: 0.9rem; margin-bottom: 0.5rem;">Registration No:</p>
                    <p style="font-size: 1.2rem; font-weight: 700; color: var(--color-accent); margin-bottom: 1.5rem;">${registrationNo}</p>
                    
                    <p style="color: var(--color-text-dim); font-size: 0.9rem; margin-bottom: 0.5rem;">Student ID:</p>
                    <p style="font-size: 1.2rem; font-weight: 700; color: var(--color-accent); margin-bottom: 0;">${studentId}</p>
                </div>
                <button class="btn btn-primary w-100" id="closeSuccessPopup">Close & Continue</button>
            </div>
        `;
        document.body.appendChild(popup);
        
        document.getElementById('closeSuccessPopup').addEventListener('click', () => {
            popup.style.opacity = '0';
            popup.style.visibility = 'hidden';
        });
    } else {
        // Update values if it already exists
        popup.querySelector('p:nth-of-type(2)').textContent = registrationNo;
        popup.querySelector('p:nth-of-type(4)').textContent = studentId;
    }
    
    // Add inline styles for the overlay if not using global modal class properly
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    popup.style.display = 'flex';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.style.zIndex = '9999';
    popup.style.opacity = '0';
    popup.style.visibility = 'hidden';
    popup.style.transition = 'all 0.3s ease';

    // Show popup
    setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.visibility = 'visible';
    }, 10);
}
