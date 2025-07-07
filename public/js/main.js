// PPT2Code 主要JavaScript文件

class PPT2CodeApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupStyleControls();
    }

    setupEventListeners() {
        // 单文件上传
        const singleFileInput = document.getElementById('singleFileInput');
        singleFileInput.addEventListener('change', (e) => {
            this.handleSingleFileUpload(e.target.files[0]);
        });

        // 批量文件上传
        const batchFileInput = document.getElementById('batchFileInput');
        batchFileInput.addEventListener('change', (e) => {
            this.handleBatchFileUpload(e.target.files);
        });
    }

    setupDragAndDrop() {
        const uploadAreas = document.querySelectorAll('.upload-area');
        
        uploadAreas.forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('dragover');
            });

            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (area.id === 'singleUploadArea' && files.length > 0) {
                    this.handleSingleFileUpload(files[0]);
                } else if (area.id === 'batchUploadArea' && files.length > 0) {
                    this.handleBatchFileUpload(files);
                }
            });
        });
    }

    async handleSingleFileUpload(file) {
        if (!this.validateFile(file)) return;

        this.showProgress('正在处理文件...');

        try {
            const formData = new FormData();
            formData.append('pptFile', file);

            // 添加样式设置
            const styleOptions = this.getStyleOptions();
            formData.append('styleOptions', JSON.stringify(styleOptions));

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.hideProgress();
                this.showResults([result]);
            } else {
                throw new Error(result.error || '上传失败');
            }
        } catch (error) {
            this.hideProgress();
            this.showError('上传失败: ' + error.message);
        }
    }

    async handleBatchFileUpload(files) {
        const validFiles = Array.from(files).filter(file => this.validateFile(file, false));

        if (validFiles.length === 0) {
            this.showError('没有有效的PPT文件');
            return;
        }

        this.showProgress(`正在处理 ${validFiles.length} 个文件...`);

        try {
            const formData = new FormData();
            validFiles.forEach(file => {
                formData.append('pptFiles', file);
            });

            // 添加样式设置
            const styleOptions = this.getStyleOptions();
            formData.append('styleOptions', JSON.stringify(styleOptions));

            const response = await fetch('/batch-upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.hideProgress();
                this.showResults(result.results);
            } else {
                throw new Error(result.error || '批量上传失败');
            }
        } catch (error) {
            this.hideProgress();
            this.showError('批量上传失败: ' + error.message);
        }
    }

    validateFile(file, showError = true) {
        const allowedTypes = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        const allowedExtensions = ['.ppt', '.pptx'];
        
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
            if (showError) {
                this.showError('只支持 .ppt 和 .pptx 格式的文件');
            }
            return false;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB限制
            if (showError) {
                this.showError('文件大小不能超过50MB');
            }
            return false;
        }

        return true;
    }

    showProgress(message) {
        const progressSection = document.getElementById('progressSection');
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        
        progressText.textContent = message;
        progressFill.style.width = '0%';
        progressSection.style.display = 'block';
        
        // 模拟进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 500);
        
        this.progressInterval = interval;
    }

    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        progressFill.style.width = '100%';
        setTimeout(() => {
            progressSection.style.display = 'none';
        }, 500);
    }

    showResults(results) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsContainer = document.getElementById('resultsContainer');
        
        resultsContainer.innerHTML = '';
        
        results.forEach(result => {
            const resultItem = this.createResultItem(result);
            resultsContainer.appendChild(resultItem);
        });
        
        resultsSection.style.display = 'block';
    }

    createResultItem(result) {
        const item = document.createElement('div');
        item.className = `result-item ${result.success ? 'success' : 'error'}`;
        
        if (result.success) {
            item.innerHTML = `
                <h4>✅ ${result.originalName}</h4>
                <p><strong>文件ID:</strong> ${result.fileId}</p>
                <p><strong>预览链接:</strong> <a href="${result.previewUrl}" target="_blank">点击预览</a></p>
                <div class="qr-preview">
                    <img src="${result.qrCodeUrl}" alt="二维码" onclick="showQRModal('${result.qrCodeUrl}', '${result.originalName}')">
                </div>
                <div class="result-actions">
                    <button class="btn" onclick="window.open('${result.previewUrl}', '_blank')">预览PPT</button>
                    <button class="btn" onclick="downloadQRCode('${result.qrCodeUrl}', '${result.originalName}')">下载二维码</button>
                </div>
            `;
        } else {
            item.innerHTML = `
                <h4>❌ ${result.originalName}</h4>
                <p><strong>错误:</strong> ${result.error}</p>
            `;
        }
        
        return item;
    }

    showError(message) {
        alert('错误: ' + message);
    }

    setupStyleControls() {
        // 设置滑块值显示
        const qrSizeSlider = document.getElementById('qrSize');
        const qrSizeValue = document.getElementById('qrSizeValue');
        const textSizeSlider = document.getElementById('textSize');
        const textSizeValue = document.getElementById('textSizeValue');

        qrSizeSlider.addEventListener('input', (e) => {
            qrSizeValue.textContent = e.target.value + 'px';
            this.updatePreview();
        });

        textSizeSlider.addEventListener('input', (e) => {
            textSizeValue.textContent = e.target.value + 'px';
            this.updatePreview();
        });

        // 监听所有样式控件变化
        const styleControls = ['qrStyle', 'foregroundColor', 'backgroundColor', 'textColor', 'textFont'];
        styleControls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updatePreview());
            }
        });

        // 初始化预览
        this.updatePreview();
    }

    updatePreview() {
        const preview = document.getElementById('stylePreview');
        const previewQR = preview.querySelector('.preview-qr');
        const previewText = preview.querySelector('.preview-text');

        const options = this.getStyleOptions();

        // 更新预览样式
        previewQR.style.backgroundColor = options.foregroundColor;
        previewQR.style.color = options.backgroundColor;
        previewQR.style.width = Math.min(80, options.qrSize / 4) + 'px';
        previewQR.style.height = Math.min(80, options.qrSize / 4) + 'px';

        if (options.style === 'rounded') {
            previewQR.style.borderRadius = '10px';
        } else if (options.style === 'shadow') {
            previewQR.style.boxShadow = '3px 3px 8px rgba(0,0,0,0.3)';
        } else {
            previewQR.style.borderRadius = '5px';
            previewQR.style.boxShadow = 'none';
        }

        previewText.style.color = options.textColor;
        previewText.style.fontSize = Math.min(16, options.textSize) + 'px';
        previewText.style.fontFamily = options.textFont;

        // 更新预览容器背景
        const previewBox = preview.querySelector('.preview-box');
        if (options.style === 'gradient') {
            previewBox.style.background = `linear-gradient(135deg, ${options.backgroundColor}, #f0f0f0)`;
        } else {
            previewBox.style.background = options.backgroundColor;
        }
    }

    getStyleOptions() {
        return {
            qrSize: parseInt(document.getElementById('qrSize').value),
            imageWidth: parseInt(document.getElementById('qrSize').value) + 100,
            imageHeight: parseInt(document.getElementById('qrSize').value) + 150,
            foregroundColor: document.getElementById('foregroundColor').value,
            backgroundColor: document.getElementById('backgroundColor').value,
            textColor: document.getElementById('textColor').value,
            textSize: parseInt(document.getElementById('textSize').value),
            textFont: document.getElementById('textFont').value,
            style: document.getElementById('qrStyle').value
        };
    }
}

// 全局函数
function showQRModal(qrUrl, fileName) {
    const modal = document.getElementById('previewModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h3>${fileName} - 二维码</h3>
        <div style="text-align: center;">
            <img src="${qrUrl}" alt="二维码" style="max-width: 100%; height: auto;">
            <p style="margin-top: 15px;">扫描二维码预览PPT</p>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('previewModal');
    modal.style.display = 'none';
}

function downloadQRCode(qrUrl, fileName) {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${fileName.replace(/\.[^/.]+$/, "")}_二维码.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadAllQRCodes() {
    const qrImages = document.querySelectorAll('.qr-preview img');
    qrImages.forEach((img, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = img.src;
            link.download = `二维码_${index + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 500); // 延迟下载避免浏览器阻止
    });
}

function resetForm() {
    const resultsSection = document.getElementById('resultsSection');
    const progressSection = document.getElementById('progressSection');
    
    resultsSection.style.display = 'none';
    progressSection.style.display = 'none';
    
    // 清空文件输入
    document.getElementById('singleFileInput').value = '';
    document.getElementById('batchFileInput').value = '';
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new PPT2CodeApp();
});

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('previewModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
