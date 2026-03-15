// ==UserScript==
// @name         KakaoPage Comic Ripper
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  Downloads chapter images from KakaoPage.
// @author       ozler365
// @license      GPL-3.0-only
// @match        https://page.kakao.com/*
// @icon         https://upload.wikimedia.org/wikipedia/commons/8/8f/Kakao_page_logo.png
// @grant        GM_download
// @run-at       document-start
// @downloadURL https://update.greasyfork.org/scripts/563056/KakaoPage%20Comic%20Ripper.user.js
// @updateURL https://update.greasyfork.org/scripts/563056/KakaoPage%20Comic%20Ripper.meta.js
// ==/UserScript==

(function() {
    'use strict';

    let capturedChapterData = null;
    let uiContainer = null;
    let btnDirect = null;
    let statusText = null;

    let isDownloading = false;

    const DELAY_BETWEEN_IMAGES = 200;
    const MAX_RETRIES = 3;
    const RETRY_WAIT = 2000;

    // --- Data Interception ---

    function findKakaoImages(obj, url) {
        if (!obj || typeof obj !== 'object') return null;

        // Ensure we are looking at the right endpoint
        if (url && !(url.includes('data?') && url.includes('series_id') && url.includes('product_id'))) {
            return null;
        }

        let searchObj = obj;
        if (obj.data) searchObj = obj.data;

        // Path: viewerData -> imageDownloadData -> files
        if (searchObj?.viewerData?.imageDownloadData?.files) {
            const files = searchObj.viewerData.imageDownloadData.files;

            // Extract title if available, otherwise fallback
            let title = searchObj?.viewerData?.title || document.title.split('-')[0].trim() || 'Kakao_Chapter';

            // Format and sort images
            const images = files.map((f, i) => ({
                // Handle possible property variations in Kakao's API
                url: f.secureUrl || f.url || f.imageUrl,
                ord: f.no || f.order || f.sortOrder || i
            })).filter(img => img.url).sort((a, b) => a.ord - b.ord);

            return {
                images: images,
                title: title
            };
        }
        return null;
    }

    // Hook XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener('load', function() {
            try {
                if (this.responseText.includes('imageDownloadData')) {
                    const res = JSON.parse(this.responseText);
                    const found = findKakaoImages(res, typeof url === 'string' ? url : url.toString());
                    if (found && found.images.length > 0) {
                        capturedChapterData = found;
                        updateUIState();
                    }
                }
            } catch (e) {}
        });
        originalOpen.apply(this, arguments);
    };

    // Hook Fetch API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        try {
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            const clone = response.clone();

            clone.json().then(data => {
                const found = findKakaoImages(data, url);
                if (found && found.images.length > 0) {
                    capturedChapterData = found;
                    updateUIState();
                }
            }).catch(() => {});
        } catch (e) {}
        return response;
    };

    // --- UI Construction ---

    function createUI() {
        if (document.getElementById('kakao-dl-container')) return;

        uiContainer = document.createElement('div');
        uiContainer.id = 'kakao-dl-container';
        Object.assign(uiContainer.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '9999',
            display: 'flex', flexDirection: 'column', gap: '8px',
            fontFamily: 'sans-serif', backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '12px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        });

        statusText = document.createElement('div');
        Object.assign(statusText.style, { color: '#fff', fontSize: '12px', textAlign: 'center', marginBottom: '4px', fontWeight: 'bold' });
        statusText.innerText = 'Waiting for Chapter Data...';

        const createBtn = (text, bgColor) => {
            const btn = document.createElement('button');
            btn.innerText = text;
            Object.assign(btn.style, {
                padding: '10px 16px', backgroundColor: bgColor, color: '#ffffff',
                border: 'none', borderRadius: '6px', cursor: 'not-allowed',
                fontWeight: 'bold', width: '100%', boxSizing: 'border-box'
            });
            btn.disabled = true;
            return btn;
        };

        btnDirect = createBtn('Direct DL (Folder)', '#5c5c5c');
        btnDirect.onclick = () => startDownload();

        uiContainer.appendChild(statusText);
        uiContainer.appendChild(btnDirect);
        document.body.appendChild(uiContainer);
    }

    function updateUIState() {
        if (!uiContainer) createUI();

        if (capturedChapterData && !isDownloading) {
            const count = capturedChapterData.images.length;
            statusText.innerText = `Ready: ${count} Pages`;

            btnDirect.style.backgroundColor = '#FFCD00'; // Kakao Yellow
            btnDirect.style.color = '#000';
            btnDirect.style.cursor = 'pointer';
            btnDirect.disabled = false;
        }
    }

    function resetUI() {
        isDownloading = false;
        btnDirect.style.display = 'block';
        updateUIState();
    }

    // --- Download Logic ---

    async function startDownload() {
        if (!capturedChapterData || isDownloading) return;

        isDownloading = true;
        const images = capturedChapterData.images;
        const folderName = sanitizeFilename(capturedChapterData.title);

        btnDirect.style.display = 'none';

        handleDirectDownload(images, folderName);
    }

    // Direct Download (GM_download)
    function handleDirectDownload(images, folderName) {
        let currentIndex = 0;
        let currentRetries = 0;
        let completed = 0;

        function downloadNext() {
            if (currentIndex >= images.length) {
                statusText.innerText = `✓ Done ${completed}/${images.length}`;
                setTimeout(resetUI, 3000);
                return;
            }

            const url = images[currentIndex].url;
            const pageNum = images[currentIndex].ord || (currentIndex + 1);
            const filename = `${String(pageNum).padStart(3, '0')}.jpg`;
            const fullPath = `${folderName}/${filename}`;

            statusText.innerText = `Folder DL: ${currentIndex + 1} / ${images.length}`;

            const handleFailure = () => {
                if (currentRetries < MAX_RETRIES) {
                    currentRetries++;
                    setTimeout(downloadNext, RETRY_WAIT);
                } else {
                    currentIndex++;
                    currentRetries = 0;
                    setTimeout(downloadNext, DELAY_BETWEEN_IMAGES);
                }
            };

            GM_download({
                url: url,
                name: fullPath,
                timeout: 15000,
                onload: function() {
                    completed++;
                    currentIndex++;
                    currentRetries = 0;
                    setTimeout(downloadNext, DELAY_BETWEEN_IMAGES);
                },
                onerror: handleFailure,
                ontimeout: handleFailure
            });
        }

        downloadNext();
    }

    function sanitizeFilename(name) {
        return name.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().substring(0, 100);
    }

    // --- Initialize ---

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
    window.addEventListener('load', createUI);

    // Monitor URL changes for SPA navigation
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            capturedChapterData = null;
            if (statusText) statusText.innerText = 'Waiting for Chapter Data...';
            if (btnDirect) {
                btnDirect.disabled = true;
                btnDirect.style.backgroundColor = '#5c5c5c';
            }
        }
    }).observe(document, {subtree: true, childList: true});

})();