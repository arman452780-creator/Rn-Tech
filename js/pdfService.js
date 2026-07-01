// js/pdfService.js

export const pdfService = {
    /**
     * Convert an image URL to a Base64 string for embedding in PDF
     */
    async getBase64ImageFromUrl(imageUrl) {
        if (!imageUrl) return null;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error converting image:", error);
            return null;
        }
    },

    /**
     * Generate the jsPDF document and return a Blob URL and the doc instance
     */
    async generateBlob(registrationNo, studentId, studentData) {
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
        
        // Logo
        const logoX = 25;
        const logoY = y + 12;
        doc.setFillColor(0, 51, 153); // Deep blue
        doc.circle(logoX, logoY, 13, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('RN-TECH', logoX, logoY + 1.5, { align: 'center' });
        
        // Main Title
        const textCenterX = pageWidth / 2;
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('RN-TECH COMPUTER ACADEMY', textCenterX, y + 5, { align: 'center' });
        
        // ISO Badge
        doc.setFillColor(0, 51, 153);
        doc.roundedRect(textCenterX - 24, y + 7.5, 48, 5.5, 1.2, 1.2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('ISO 9001:2015 CERTIFIED', textCenterX, y + 11.5, { align: 'center' });
        
        // Subtitle
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('Learn Today • Lead Tomorrow', textCenterX, y + 18, { align: 'center' });
        
        // Contact Info Row
        const contactY = y + 28;
        doc.setDrawColor(100, 100, 100);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setLineWidth(0.3);
        
        // 1. Web
        const xWeb = textCenterX - 50;
        doc.circle(xWeb - 6, contactY - 1, 2.2); // globe outline
        doc.line(xWeb - 8.2, contactY - 1, xWeb - 3.8, contactY - 1); // equator
        doc.line(xWeb - 6, contactY - 3.2, xWeb - 6, contactY + 1.2); // meridian
        doc.ellipse(xWeb - 6, contactY - 1, 1, 2.2); // longitude ellipse
        doc.text('rntechraiyam.com', xWeb - 2, contactY);
        
        // 2. Phone
        const xPhone = textCenterX - 5;
        doc.setFillColor(100, 100, 100);
        doc.roundedRect(xPhone - 6, contactY - 3.5, 3, 5, 0.5, 0.5, 'F');
        doc.text('+91 8102166667', xPhone - 1, contactY);
        
        // 3. Email
        const xMail = textCenterX + 35;
        doc.rect(xMail - 7, contactY - 3.5, 5, 3.5);
        doc.line(xMail - 7, contactY - 3.5, xMail - 4.5, contactY - 1.5);
        doc.line(xMail - 2, contactY - 3.5, xMail - 4.5, contactY - 1.5);
        doc.text('razjalal@gamil.com', xMail, contactY);

        // Thick Blue Separator Line
        doc.setDrawColor(0, 51, 153);
        doc.setLineWidth(1.2);
        doc.line(margin, y + 34, pageWidth - margin, y + 34);
        
        y += 42;
        
        // Title: Admission Registration Form
        doc.setFillColor(242, 248, 255); // Very light blue background
        doc.setDrawColor(0, 51, 153);
        doc.setLineWidth(0.5);
        doc.roundedRect(pageWidth/2 - 45, y, 90, 10, 1.5, 1.5, 'FD'); // Fill and stroke with rounded corners
        doc.setTextColor(0, 51, 153);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('ADMISSION REGISTRATION FORM', pageWidth/2, y + 6.5, { align: 'center' });
        
        y += 16;
        
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
                    if (f2 && f2.label !== '') {
                        i--; // process f2 in next iteration
                    }
                } else {
                    const lines1 = f1Lines.length;
                    const lines2 = f2Lines.length;
                    const maxLines = Math.max(lines1, lines2, 1);
                    const rowHeight = Math.max(8, maxLines * 4 + 4);
                    
                    // Draw cells
                    doc.rect(margin, currentY, colWidth * 0.4, rowHeight);
                    doc.rect(margin + colWidth * 0.4, currentY, colWidth * 0.6, rowHeight);
                    
                    doc.setTextColor(68, 68, 68);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.text(f1.label + ':', margin + 3, currentY + rowHeight/2 + 1.5);
                    
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'normal');
                    doc.text(f1Lines, margin + colWidth * 0.4 + 3, currentY + rowHeight/2 - ((lines1 - 1) * 2) + 1.5);
                    
                    if (f2 && f2.label !== '') {
                        doc.rect(margin + colWidth, currentY, colWidth * 0.4, rowHeight);
                        doc.rect(margin + colWidth * 1.4, currentY, colWidth * 0.6, rowHeight);
                        
                        doc.setTextColor(68, 68, 68);
                        doc.setFont('helvetica', 'bold');
                        doc.text(f2.label + ':', margin + colWidth + 3, currentY + rowHeight/2 + 1.5);
                        
                        doc.setTextColor(0, 0, 0);
                        doc.setFont('helvetica', 'normal');
                        doc.text(f2Lines, margin + colWidth * 1.4 + 3, currentY + rowHeight/2 - ((lines2 - 1) * 2) + 1.5);
                    }
                    currentY += rowHeight;
                }
            }
            return { newY: currentY, photoRect: isStudentSection ? { x: margin + boxWidth, y: startY, w: 35, h: currentY - startY } : null };
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
        let res1 = drawTableGrid(admissionFields, y, false);
        y = res1.newY + 10;
        
        // 2. Student Details
        y = drawSectionHeader('STUDENT DETAILS', y);
        const studentFields = [
            { label: 'Student Name', value: studentData.student_name },
            { label: 'Father\'s Name', value: studentData.father_name },
            { label: 'Gender', value: studentData.gender },
            { label: 'Date of Birth', value: studentData.dob ? studentData.dob.split('-').reverse().join('/') : '' },
            { label: 'Mobile Number', value: studentData.mobile },
            { label: 'State', value: studentData.state },
            { label: 'District', value: studentData.district },
            { label: '', value: '' }, // filler to align address to full width
            { label: 'Address', value: studentData.address, fullWidth: true }
        ];
        let res2 = drawTableGrid(studentFields, y, true);
        y = res2.newY + 10;

        // Add Profile Photo
        if (res2.photoRect) {
            if (studentData.profile_photo_url) {
                const b64 = await this.getBase64ImageFromUrl(studentData.profile_photo_url);
                if (b64) {
                    doc.addImage(b64, 'JPEG', res2.photoRect.x + 1, res2.photoRect.y + 1, res2.photoRect.w - 2, res2.photoRect.h - 2);
                } else {
                    doc.setTextColor(153, 153, 153);
                    doc.setFont('helvetica', 'normal');
                    doc.text("No Photo", res2.photoRect.x + res2.photoRect.w/2, res2.photoRect.y + res2.photoRect.h/2 + 1.5, { align: 'center' });
                }
            } else {
                doc.setTextColor(153, 153, 153);
                doc.setFont('helvetica', 'normal');
                doc.text("No Photo", res2.photoRect.x + res2.photoRect.w/2, res2.photoRect.y + res2.photoRect.h/2 + 1.5, { align: 'center' });
            }
        }
        
        // 3. Course Details
        y = drawSectionHeader('COURSE DETAILS', y);
        const courseFields = [
            { label: 'Course Name', value: studentData.course },
            { label: 'Course Category', value: studentData.course_category },
            { label: 'Course Duration', value: studentData.course_duration },
            { label: 'Total Fee', value: studentData.net_fee ? 'Rs. ' + studentData.net_fee : 'N/A' }
        ];
        let res3 = drawTableGrid(courseFields, y, false);
        y = res3.newY + 10;
        
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
        const sigWidth = 45;
        const sigSpacing = (pageWidth - (margin*2) - (sigWidth*3)) / 2;
        y += 15;
        
        // Admin Signature placeholder
        let sigX = margin;
        doc.setDrawColor(51, 51, 51);
        doc.setLineWidth(0.3);
        doc.line(sigX, y, sigX + sigWidth, y);
        doc.setTextColor(51, 51, 51);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Admin Signature', sigX + sigWidth/2, y + 5, { align: 'center' });
        
        // Student Signature placeholder
        sigX += sigWidth + sigSpacing;
        doc.line(sigX, y, sigX + sigWidth, y);
        doc.text('Student Signature', sigX + sigWidth/2, y + 5, { align: 'center' });
        
        // Director Signature placeholder
        sigX += sigWidth + sigSpacing;
        doc.line(sigX, y, sigX + sigWidth, y);
        doc.text('Authorized Signature', sigX + sigWidth/2, y + 5, { align: 'center' });
        
        // 6. Footer & QR Code
        const footerY = pageHeight - margin - 12;
        doc.setDrawColor(204, 204, 204);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        
        const now = new Date();
        doc.setTextColor(102, 102, 102);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()} | rntechraiyam.com`, pageWidth/2, footerY + 10, { align: 'center' });
        
        return new Promise((resolve) => {
            const qrContainer = document.getElementById('pdf-qrcode') || (function(){
                let div = document.createElement('div');
                div.id = 'pdf-qrcode';
                div.style.display = 'none';
                document.body.appendChild(div);
                return div;
            })();

            if (typeof window.QRCode !== 'undefined') {
                qrContainer.innerHTML = '';
                new window.QRCode(qrContainer, {
                    text: `Reg: ${registrationNo} | ID: ${studentId}`,
                    width: 80,
                    height: 80,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : window.QRCode.CorrectLevel.L
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
    },

    /**
     * Public alias for general generating
     */
    async generateRegistrationPDF(studentData, registrationNo, studentId) {
        return this.generateBlob(registrationNo, studentId, studentData);
    },

    /**
     * Preview Registration PDF in a new tab
     */
    async previewRegistrationPDF(studentData, registrationNo, studentId) {
        const result = await this.generateBlob(registrationNo, studentId, studentData);
        if (result && result.blobUrl) {
            // Attempt to open blob in new tab
            const newWindow = window.open(result.blobUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                // Pop-up blocked, show iframe modal fallback
                this.showPdfModal(result.blobUrl);
            }
        }
    },

    /**
     * Download Registration PDF
     */
    async downloadRegistrationPDF(studentData, registrationNo, studentId) {
        const result = await this.generateBlob(registrationNo, studentId, studentData);
        if (result && result.doc) {
            result.doc.save(`RNTECH_Registration_${registrationNo}.pdf`);
        }
    },

    /**
     * Print Registration PDF
     */
    async printRegistrationPDF(studentData, registrationNo, studentId) {
        const result = await this.generateBlob(registrationNo, studentId, studentData);
        if (result && result.blobUrl) {
            const printIframe = document.createElement('iframe');
            printIframe.style.position = 'absolute';
            printIframe.style.top = '-1000px';
            printIframe.style.left = '-1000px';
            printIframe.src = result.blobUrl;
            document.body.appendChild(printIframe);
            printIframe.onload = () => {
                printIframe.contentWindow.focus();
                printIframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(printIframe);
                }, 2000);
            };
        }
    },

    /**
     * Fallback Modal for PDF Preview if pop-ups are blocked
     */
    showPdfModal(blobUrl) {
        let modal = document.getElementById('pdfPreviewModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'pdfPreviewModal';
            Object.assign(modal.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '999999',
                backdropFilter: 'blur(5px)'
            });

            const content = document.createElement('div');
            Object.assign(content.style, {
                width: '90%',
                maxWidth: '1000px',
                height: '90vh',
                backgroundColor: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            });

            const header = document.createElement('div');
            Object.assign(header.style, {
                padding: '1rem',
                backgroundColor: '#1a1a24',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            });
            header.innerHTML = `
                <h3 style="margin: 0; font-size: 1.2rem;">PDF Preview</h3>
                <button id="closePdfModal" style="background: transparent; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;">&times;</button>
            `;

            const iframe = document.createElement('iframe');
            iframe.id = 'pdfPreviewIframe';
            Object.assign(iframe.style, {
                flex: '1',
                width: '100%',
                border: 'none'
            });

            content.appendChild(header);
            content.appendChild(iframe);
            modal.appendChild(content);

            document.getElementById('closePdfModal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        document.getElementById('pdfPreviewIframe').src = blobUrl;
        modal.style.display = 'flex';
    }
};
