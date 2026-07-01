import { getSupabase } from './supabase-client.js';

// Configuration
const CONFIG = {
    TARGET_WIDTH: 400,
    TARGET_HEIGHT: 400,
    MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
    CROPPER_CSS: 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',
    CROPPER_JS: 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js'
};

// Toast Notifications
const showToast = (message, type = 'info') => {
    let container = document.getElementById('image-service-toasts');
    if (!container) {
        container = document.createElement('div');
        container.id = 'image-service-toasts';
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        });
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    Object.assign(toast.style, {
        background: type === 'error' ? '#ff4d4d' : (type === 'success' ? '#28a745' : '#004aad'),
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        opacity: '0',
        transform: 'translateY(20px)',
        transition: 'all 0.3s ease'
    });
    toast.textContent = message;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

export const imageService = {
    validateImage(file) {
        showToast('Validating Image...', 'info');
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('Unsupported format. Please upload JPG, PNG, or WEBP.', 'error');
            throw new Error('Unsupported format');
        }
        return true;
    },

    async lazyLoadDependencies() {
        return new Promise((resolve, reject) => {
            let loaded = 0;
            const checkDone = () => {
                loaded++;
                if (loaded === 2) resolve();
            };

            if (!document.querySelector(`link[href="${CONFIG.CROPPER_CSS}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = CONFIG.CROPPER_CSS;
                link.onload = checkDone;
                link.onerror = () => reject(new Error('Failed to load cropper CSS'));
                document.head.appendChild(link);
            } else {
                checkDone();
            }

            if (typeof Cropper === 'undefined') {
                const script = document.createElement('script');
                script.src = CONFIG.CROPPER_JS;
                script.onload = checkDone;
                script.onerror = () => reject(new Error('Failed to load cropper JS'));
                document.head.appendChild(script);
            } else {
                checkDone();
            }
        });
    },

    async openCropEditor(file) {
        try {
            this.validateImage(file);
            
            showToast('Preparing Crop Editor...', 'info');
            await this.lazyLoadDependencies();
            
            // Read file for cropping
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });

            return await this._showCropModal(dataUrl, file.size);
        } catch (error) {
            console.error('Cropper Error:', error);
            throw error;
        }
    },

    _showCropModal(imageSrc, originalSize) {
        return new Promise((resolve, reject) => {
            // Create Modal UI
            const modal = document.createElement('div');
            Object.assign(modal.style, {
                position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
                background: 'rgba(0,0,0,0.95)', zIndex: '99999', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            });

            const header = document.createElement('div');
            header.innerHTML = '<h3 style="color:white; margin:0 0 10px 0; font-family:sans-serif;">Adjust Passport Photo</h3><p style="color:#aaa; margin:0 0 20px 0; font-size:14px; font-family:sans-serif;">Move and zoom to fit your face inside the guide. Aspect ratio is locked.</p>';
            header.style.textAlign = 'center';
            modal.appendChild(header);

            const container = document.createElement('div');
            Object.assign(container.style, {
                width: '100%', maxWidth: '500px', height: '500px',
                position: 'relative', background: '#111', borderRadius: '8px', overflow: 'hidden'
            });

            const img = document.createElement('img');
            img.src = imageSrc;
            img.style.display = 'block';
            img.style.maxWidth = '100%';
            container.appendChild(img);

            // Safe Area Guide Overlay (non-exported)
            const guide = document.createElement('div');
            Object.assign(guide.style, {
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '250px', height: '320px',
                border: '2px dashed rgba(255, 255, 255, 0.7)',
                borderRadius: '125px 125px 50px 50px', // Head shape
                pointerEvents: 'none', zIndex: '9999',
                display: 'none', // will show after cropper init
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)' // Dim surroundings
            });
            container.appendChild(guide);

            const controls = document.createElement('div');
            Object.assign(controls.style, {
                display: 'flex', gap: '15px', marginTop: '20px'
            });

            const btnCancel = document.createElement('button');
            btnCancel.textContent = 'Cancel';
            Object.assign(btnCancel.style, { padding: '10px 24px', borderRadius: '4px', border: 'none', background: '#444', color: '#fff', cursor: 'pointer', fontWeight: 'bold' });

            const btnReset = document.createElement('button');
            btnReset.innerHTML = '&#8635; Reset';
            Object.assign(btnReset.style, { padding: '10px 24px', borderRadius: '4px', border: 'none', background: '#004aad', color: '#fff', cursor: 'pointer', fontWeight: 'bold' });

            const btnDone = document.createElement('button');
            btnDone.textContent = '✓ Crop & Save';
            Object.assign(btnDone.style, { padding: '10px 24px', borderRadius: '4px', border: 'none', background: '#28a745', color: '#fff', cursor: 'pointer', fontWeight: 'bold' });

            controls.appendChild(btnCancel);
            controls.appendChild(btnReset);
            controls.appendChild(btnDone);

            modal.appendChild(container);
            modal.appendChild(controls);
            document.body.appendChild(modal);

            // Init Cropper
            let cropper = new Cropper(img, {
                aspectRatio: 1, // Strict 1:1 square
                viewMode: 1, // Restrict crop box to canvas
                dragMode: 'move', // Only move image
                autoCropArea: 1, // Cover whole cropper area
                restore: false,
                guides: false, // We use custom guide
                center: true,
                highlight: false,
                cropBoxMovable: false, // Locked crop box
                cropBoxResizable: false, // Locked size
                toggleDragModeOnDblclick: false,
                ready() {
                    guide.style.display = 'block'; // Show guide
                }
            });

            // Events
            btnCancel.onclick = () => {
                cropper.destroy();
                modal.remove();
                reject(new Error('Crop Cancelled'));
            };

            btnReset.onclick = () => {
                cropper.reset();
            };

            btnDone.onclick = async () => {
                showToast('Compressing...', 'info');
                
                // Extract 400x400 exactly (automatically strips EXIF/Orientation because Canvas renders visually)
                const canvas = cropper.getCroppedCanvas({
                    width: CONFIG.TARGET_WIDTH,
                    height: CONFIG.TARGET_HEIGHT,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });

                // Adaptive compress
                showToast('Optimizing...', 'info');
                const processedBlob = await this.adaptiveCompress(canvas, originalSize);
                
                cropper.destroy();
                modal.remove();
                
                resolve(processedBlob);
            };
        });
    },

    adaptiveCompress(canvas, originalSize) {
        return new Promise((resolve) => {
            let quality = 0.9; 
            if (originalSize > 10 * 1024 * 1024) {
                quality = 0.7; // Heavy compression
            } else if (originalSize > 5 * 1024 * 1024) {
                quality = 0.8; // Medium compression
            } else if (originalSize > 2 * 1024 * 1024) {
                quality = 0.85; // Light compression
            }

            const attemptCompression = (q) => {
                canvas.toBlob((blob) => {
                    if (blob.size > CONFIG.MAX_FILE_SIZE && q > 0.4) {
                        attemptCompression(q - 0.1);
                    } else {
                        resolve(blob);
                    }
                }, 'image/jpeg', q);
            };

            attemptCompression(quality);
        });
    },

    async uploadProcessedImage(blob, studentId, year) {
        showToast('Uploading...', 'info');
        const supabase = getSupabase();
        // Strict folder structure: student-photos/YYYY/StudentID.jpg
        const path = `student-photos/${year}/${studentId}.jpg`;

        const { data, error } = await supabase.storage
            .from('student-photos')
            .upload(path, blob, {
                cacheControl: '3600',
                upsert: true, // Overwrites if exists
                contentType: 'image/jpeg'
            });

        if (error) {
            showToast('Upload failed. Try again.', 'error');
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from('student-photos')
            .getPublicUrl(path);

        return `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
    },

    async replaceImage(blob, studentId, year) {
        // Since we use upsert: true and structured paths, uploading automatically replaces the old one.
        return await this.uploadProcessedImage(blob, studentId, year);
    },

    generatePreviewUrl(blob) {
        return URL.createObjectURL(blob);
    }
};
