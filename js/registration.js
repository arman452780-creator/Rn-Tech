import { studentService } from './studentService.js';
import { imageService } from './imageService.js';
import { pdfService } from './pdfService.js';

let selectedPhotoFile = null;

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('courseRegisterForm');
    
    // Photo Upload Logic
    const photoInput = document.getElementById('studentPhotoInput');
    const photoArea = document.getElementById('photoUploadArea');
    const photoPlaceholder = document.getElementById('photoPlaceholder');
    const photoPreview = document.getElementById('photoPreview');
    const previewImg = document.getElementById('previewImage');
    const replaceBtn = document.getElementById('replacePhotoBtn');
    const removeBtn = document.getElementById('removePhotoBtn');
    const errorMsg = document.getElementById('photoErrorMsg');

    if (photoInput && photoArea) {
        // Click to upload
        photoPlaceholder.addEventListener('click', () => photoInput.click());
        replaceBtn.addEventListener('click', () => photoInput.click());
        
        // Remove photo
        removeBtn.addEventListener('click', () => {
            selectedPhotoFile = null;
            photoInput.value = '';
            photoPreview.style.display = 'none';
            photoPlaceholder.style.display = 'flex';
            errorMsg.style.display = 'none';
        });

        // Drag and drop
        photoArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            photoArea.parentElement.classList.add('drag-over');
        });

        photoArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            photoArea.parentElement.classList.remove('drag-over');
        });

        photoArea.addEventListener('drop', (e) => {
            e.preventDefault();
            photoArea.parentElement.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handlePhotoSelection(e.dataTransfer.files[0]);
            }
        });

        // File input change
        photoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handlePhotoSelection(e.target.files[0]);
            }
            // Clear input so same file can be selected again
            e.target.value = '';
        });
    }

    async function handlePhotoSelection(file) {
        errorMsg.style.display = 'none';
        
        try {
            // This will validate, open crop editor, compress, and return the processed Blob
            const processedBlob = await imageService.openCropEditor(file);
            
            // Set the selected file for upload later
            selectedPhotoFile = new File([processedBlob], 'photo.jpg', { type: 'image/jpeg' });
            
            // Show preview
            previewImg.src = imageService.generatePreviewUrl(processedBlob);
            photoPlaceholder.style.display = 'none';
            photoPreview.style.display = 'flex';
        } catch (error) {
            console.error('Photo processing failed:', error);
            if (error.message !== 'Crop Cancelled') {
                showPhotoError(error.message || 'Failed to process image. Please try again.');
            }
        }
    }

    function showPhotoError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
        selectedPhotoFile = null;
        photoInput.value = '';
        photoPreview.style.display = 'none';
        photoPlaceholder.style.display = 'flex';
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            // Loading state
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            try {
                if (!selectedPhotoFile) {
                    showErrorPopup('Please upload a passport-size photo to complete registration.');
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                    return;
                }

                submitBtn.textContent = 'Uploading Photo...';
                const formData = new FormData(registerForm);
                const data = Object.fromEntries(formData.entries());
                
                // Generate IDs first to use in photo upload path
                const admissionYear = data.asession || '';
                const registrationNo = await studentService.generateRegistrationNo(admissionYear);
                const studentId = await studentService.generateStudentId();
                
                // Upload Photo
                const yearStr = admissionYear ? admissionYear.split('-')[0] : new Date().getFullYear().toString();
                submitBtn.textContent = 'Uploading Photo...';
                const profilePhotoUrl = await imageService.uploadProcessedImage(selectedPhotoFile, studentId, yearStr);
                
                submitBtn.textContent = 'Submitting...';
                
                // Map the form data to match our students table schema
                const studentData = {
                    registration_no: registrationNo,
                    student_id: studentId,
                    admission_year: admissionYear,
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
                    date_of_admission: data.doj || null,
                    profile_photo_url: profilePhotoUrl
                };

                // Register student
                const newStudent = await studentService.registerStudent(studentData);
                
                // Show success popup
                showSuccessPopup(newStudent, studentData);
                
                // Clear the form
                registerForm.reset();
                const removeBtn = document.getElementById('removePhotoBtn');
                if (removeBtn) removeBtn.click();
                
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

function showSuccessPopup(newStudent, studentData) {
    const registrationNo = newStudent.registration_no;
    const studentId = newStudent.student_id;
    
    let generatedPdfBlobUrl = null;
    let generatedPdfDoc = null;

    pdfService.generateBlob(registrationNo, studentId, studentData).then(result => {
        if (result) {
            generatedPdfBlobUrl = result.blobUrl;
            generatedPdfDoc = result.doc;
        }
    });

    // Check if popup already exists, if not create it
    let popup = document.getElementById('registrationSuccessPopup');
    
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'registrationSuccessPopup';
        popup.className = 'modal-overlay';
        document.body.appendChild(popup);
    }
    
    popup.innerHTML = `
        <div class="modal-content text-center" style="max-width: 450px; background: var(--color-bg-card); border: 1px solid var(--color-accent); border-radius: 12px; padding: 2.5rem; text-align: center; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);">
            <i class="fas fa-check-circle" style="font-size: 4rem; color: #00ff00; margin-bottom: 1.5rem;"></i>
            <h2 style="margin-bottom: 1rem; color: #fff;">Registration Successful</h2>
            
            <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; text-align: left;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: var(--color-text-dim); font-size: 0.9rem;">Registration No:</span>
                    <strong style="color: var(--color-accent);">${registrationNo}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: var(--color-text-dim); font-size: 0.9rem;">Student ID:</span>
                    <strong style="color: var(--color-accent);">${studentId}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: var(--color-text-dim); font-size: 0.9rem;">Course:</span>
                    <strong style="color: #fff;">${studentData.course}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--color-text-dim); font-size: 0.9rem;">Admission Date:</span>
                    <strong style="color: #fff;">${studentData.date_of_admission}</strong>
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="btn btn-primary w-100" id="btnViewPdf" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-file-pdf"></i> View Registration Form
                </button>
                <button class="btn btn-outline w-100" id="btnDownloadPdf" style="display: flex; align-items: center; justify-content: center; gap: 8px; border-color: var(--rn-color-primary); color: var(--rn-color-primary);">
                    <i class="fas fa-download"></i> Download PDF
                </button>
                <button class="btn btn-outline w-100" id="btnHome" style="display: flex; align-items: center; justify-content: center; gap: 8px; border-color: rgba(255,255,255,0.2); color: #ccc;">
                    <i class="fas fa-home"></i> Back to Home
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners for new buttons
    const btnViewPdf = document.getElementById('btnViewPdf');
    if (btnViewPdf) {
        btnViewPdf.addEventListener('click', () => {
            if (generatedPdfBlobUrl) {
                window.open(generatedPdfBlobUrl, '_blank');
            } else {
                alert("PDF is still generating. Please wait a second.");
            }
        });
    }

    const btnDownloadPdf = document.getElementById('btnDownloadPdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', () => {
            if (generatedPdfDoc) {
                generatedPdfDoc.save(`RNTECH_Registration_${registrationNo}.pdf`);
            } else {
                alert("PDF is still generating. Please wait a second.");
            }
        });
    }

    const btnHome = document.getElementById('btnHome');
    if (btnHome) {
        btnHome.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
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

    // Show popup
    setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.visibility = 'visible';
    }, 10);
}

// Removed PDF logic to pdfService.js
