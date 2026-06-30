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
                showSuccessPopup(newStudent, studentData);
                
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

function showSuccessPopup(newStudent, studentData) {
    const registrationNo = newStudent.registration_no;
    const studentId = newStudent.student_id;
    
    let generatedPdfBlobUrl = null;
    let generatedPdfDoc = null;

    generatePDFBlobUrl(registrationNo, studentId, studentData).then(result => {
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

export async function generatePDFBlobUrl(registrationNo, studentId, studentData) {
    if (!window.jspdf) {
        console.error("jsPDF library is not loaded.");
        return null;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;
    
    // Header
    doc.setDrawColor(0, 74, 173);
    doc.setLineWidth(1);
    doc.line(margin, y + 25, pageWidth - margin, y + 25);
    
    doc.setTextColor(0, 74, 173);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RN-TECH COMPUTER ACADEMY', pageWidth/2, y + 10, { align: 'center' });
    
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(10);
    doc.text('ISO 9001:2015 Certified', pageWidth/2, y + 15, { align: 'center' });
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(85, 85, 85);
    doc.text('Raiyam,Madhubani | Phone: +91 8102166667 | Email: razjalal@gamil.com', pageWidth/2, y + 21, { align: 'center' });
    
    y += 32;
    
    // Title
    doc.setFillColor(240, 248, 255);
    doc.setDrawColor(0, 74, 173);
    doc.setLineWidth(0.5);
    doc.rect(pageWidth/2 - 45, y, 90, 9, 'FD');
    doc.setTextColor(0, 74, 173);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ADMISSION REGISTRATION FORM', pageWidth/2, y + 6, { align: 'center' });
    
    y += 15;
    
    function drawSectionHeader(title, yPos) {
        doc.setFillColor(0, 74, 173);
        doc.setDrawColor(0, 74, 173);
        doc.rect(margin, yPos, pageWidth - (margin*2), 7, 'FD');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(title, margin + 4, yPos + 5);
        return yPos + 7;
    }
    
    function drawTableGrid(fields, startY, isStudentSection = false) {
        let currentY = startY;
        const boxWidth = isStudentSection ? (pageWidth - 2 * margin - 35) : (pageWidth - 2 * margin);
        const colWidth = boxWidth / 2;
        
        doc.setDrawColor(204, 204, 204);
        doc.setLineWidth(0.2);
        
        for (let i = 0; i < fields.length; i += 2) {
            const f1 = fields[i];
            const f2 = fields[i+1];
            
            // if filler
            if (f1.label === '' && f1.value === '') {
                doc.rect(margin, currentY, colWidth, 8);
                if (f2 && f2.label !== '') {
                    i--; // process f2 in next iteration
                }
                currentY += 8;
                continue;
            }
            
            let f1Val = String(f1.value || 'N/A');
            let f1Lines = doc.splitTextToSize(f1Val, colWidth * 0.6 - 6);
            let f2Lines = [];
            
            if (f2 && f2.label !== '') {
                let f2Val = String(f2.value || 'N/A');
                f2Lines = doc.splitTextToSize(f2Val, colWidth * 0.6 - 6);
            }
            
            if (f1.fullWidth) {
                f1Lines = doc.splitTextToSize(f1Val, boxWidth * 0.7 - 6);
                const lines = f1Lines.length;
                const rH = Math.max(8, lines * 4 + 4);
                
                doc.rect(margin, currentY, boxWidth * 0.3, rH);
                doc.rect(margin + boxWidth * 0.3, currentY, boxWidth * 0.7, rH);
                
                doc.setTextColor(68, 68, 68);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text(f1.label + ':', margin + 3, currentY + rH/2 + 1.5);
                
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                doc.text(f1Lines, margin + boxWidth * 0.3 + 3, currentY + rH/2 - ((lines - 1) * 2) + 1.5);
                
                currentY += rH;
                i--; // adjust loop
                continue;
            }
            
            const lines = Math.max(f1Lines.length, f2 ? f2Lines.length : 1);
            const rH = Math.max(8, lines * 4 + 4);
            
            // Col 1
            doc.rect(margin, currentY, colWidth * 0.4, rH);
            doc.rect(margin + colWidth * 0.4, currentY, colWidth * 0.6, rH);
            
            doc.setTextColor(68, 68, 68);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(f1.label + ':', margin + 3, currentY + rH/2 + 1.5);
            
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text(f1Lines, margin + colWidth * 0.4 + 3, currentY + rH/2 - ((f1Lines.length - 1) * 2) + 1.5);
            
            // Col 2
            if (f2 && f2.label !== '') {
                const startX2 = margin + colWidth;
                doc.rect(startX2, currentY, colWidth * 0.4, rH);
                doc.rect(startX2 + colWidth * 0.4, currentY, colWidth * 0.6, rH);
                
                doc.setTextColor(68, 68, 68);
                doc.setFont('helvetica', 'bold');
                doc.text(f2.label + ':', startX2 + 3, currentY + rH/2 + 1.5);
                
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                doc.text(f2Lines, startX2 + colWidth * 0.4 + 3, currentY + rH/2 - ((f2Lines.length - 1) * 2) + 1.5);
            } else if (f2 && f2.label === '') {
                 // Draw empty cell to complete the grid
                 const startX2 = margin + colWidth;
                 doc.rect(startX2, currentY, colWidth, rH);
            }
            
            currentY += rH;
        }
        
        if (isStudentSection) {
            doc.setDrawColor(204, 204, 204);
            doc.rect(margin + boxWidth, startY, 35, currentY - startY);
            doc.setTextColor(153, 153, 153);
            doc.setFont('helvetica', 'normal');
            doc.text("No Photo", margin + boxWidth + 17.5, startY + (currentY - startY)/2 + 1.5, { align: 'center' });
        }
        
        return currentY;
    }

    // 1. Admission Details
    y = drawSectionHeader('ADMISSION DETAILS', y);
    const admissionFields = [
        { label: 'Registration Number', value: registrationNo },
        { label: 'Student ID', value: studentId },
        { label: 'Admission Year', value: studentData.admission_year },
        { label: 'Admission Date', value: studentData.date_of_admission ? studentData.date_of_admission.split('-').reverse().join('/') : '' },
        { label: 'Status', value: 'Confirmed' },
        { label: '', value: '' } // filler
    ];
    y = drawTableGrid(admissionFields, y, false);
    y += 10;
    
    // 2. Student Details
    y = drawSectionHeader('STUDENT DETAILS', y);
    const studentFields = [
        { label: 'Student Name', value: studentData.student_name },
        { label: 'Father\'s Name', value: studentData.father_name },
        { label: 'Gender', value: studentData.gender },
        { label: 'Date of Birth', value: studentData.dob },
        { label: 'Mobile Number', value: studentData.mobile },
        { label: 'State', value: studentData.state },
        { label: 'District', value: studentData.district },
        { label: '', value: '' }, // filler to align address to full width
        { label: 'Address', value: studentData.address, fullWidth: true }
    ];
    y = drawTableGrid(studentFields, y, true);
    y += 10;
    
    // 3. Course Details
    y = drawSectionHeader('COURSE DETAILS', y);
    const courseFields = [
        { label: 'Course Name', value: studentData.course },
        { label: 'Course Category', value: studentData.course_category },
        { label: 'Course Duration', value: studentData.course_duration },
        { label: 'Total Fee', value: studentData.net_fee ? 'Rs. ' + studentData.net_fee : 'N/A' }
    ];
    y = drawTableGrid(courseFields, y, false);
    y += 10;
    
    // 4. Declaration
    y = drawSectionHeader('DECLARATION', y);
    doc.setDrawColor(204, 204, 204);
    doc.setFillColor(249, 249, 249);
    doc.rect(margin, y, pageWidth - (margin*2), 15, 'FD');
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('"I hereby declare that all information provided by me is true and correct.', margin + 5, y + 6.5);
    doc.text('I agree to follow all rules and regulations of RN-TECH Computer Academy."', margin + 5, y + 11.5);
    y += 15;
    
    // 5. Signatures
    y += 25; 
    const sigWidth = 45;
    const sigSpacing = (pageWidth - 2 * margin - 3 * sigWidth) / 2;
    
    let sigX = margin;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    
    doc.line(sigX, y, sigX + sigWidth, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);
    doc.text('Student Signature', sigX + sigWidth/2, y + 5, { align: 'center' });
    
    sigX += sigWidth + sigSpacing;
    doc.line(sigX, y, sigX + sigWidth, y);
    doc.text('Guardian Signature', sigX + sigWidth/2, y + 5, { align: 'center' });
    
    sigX += sigWidth + sigSpacing;
    doc.line(sigX, y, sigX + sigWidth, y);
    doc.text('Authorized Signature', sigX + sigWidth/2, y + 5, { align: 'center' });
    

    
    // 6. Footer & QR Code
    const footerY = pageHeight - margin - 12;
    doc.setDrawColor(204, 204, 204);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    const now = new Date();
    doc.setTextColor(102, 102, 102);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()} | rntechraiyam.com`, pageWidth/2, footerY + 10, { align: 'center' });
    
    return new Promise((resolve) => {
        const qrContainer = document.getElementById('pdf-qrcode');
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: `Reg: ${registrationNo} | ID: ${studentId}`,
                width: 80,
                height: 80,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.L
            });
            
            setTimeout(() => {
                const canvas = qrContainer.querySelector('canvas');
                if (canvas) {
                    const qrDataUrl = canvas.toDataURL('image/png');
                    const qrSize = 20;
                    doc.addImage(qrDataUrl, 'PNG', margin, footerY - qrSize - 5, qrSize, qrSize);
                }
                const blob = doc.output('blob');
                resolve({
                    blobUrl: URL.createObjectURL(blob),
                    doc: doc
                });
            }, 100);
        } else {
            const blob = doc.output('blob');
            resolve({
                blobUrl: URL.createObjectURL(blob),
                doc: doc
            });
        }
    });
}
