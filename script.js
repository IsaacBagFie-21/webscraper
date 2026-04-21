document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('extract-form');
    const urlInput = document.getElementById('reel-url');
    const extractBtn = document.getElementById('extract-btn');
    const btnText = extractBtn.querySelector('.btn-text');
    const loader = extractBtn.querySelector('.loader');
    const errorMessage = document.getElementById('error-message');
    
    const resultContainer = document.getElementById('result-container');
    const rawUrlOutput = document.getElementById('raw-url-output');
    const copyBtn = document.getElementById('copy-btn');
    const videoPlayer = document.getElementById('video-player');
    const downloadBtn = document.getElementById('download-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const reelUrl = urlInput.value.trim();

        if (!reelUrl) return;

        // Basic validation for Instagram URL
        if (!reelUrl.includes('instagram.com/reel/') && !reelUrl.includes('instagram.com/p/')) {
            showError("Please enter a valid Instagram Reel or Post URL.");
            return;
        }

        // Reset UI
        hideError();
        resultContainer.classList.add('hidden');
        setLoading(true);

        try {
            const rawMp4Url = await fetchRawVideoUrl(reelUrl);
            
            if (rawMp4Url) {
                // Populate Results
                rawUrlOutput.value = rawMp4Url;
                videoPlayer.src = rawMp4Url;
                downloadBtn.href = rawMp4Url;
                
                // Show Results
                resultContainer.classList.remove('hidden');
            } else {
                throw new Error("Could not extract a valid MP4 URL from the response.");
            }
        } catch (error) {
            console.error("Extraction error:", error);
            showError(`Failed to extract link. ${error.message} (Are you sure it's a public video?)`);
        } finally {
            setLoading(false);
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(rawUrlOutput.value);
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert("Failed to copy. Please manually copy the link.");
        }
    });

    /**
     * Utilizes our local Python backend API powered by yt-dlp
     * to reliably extract the direct media URL.
     */
    async function fetchRawVideoUrl(url) {
        const endpoint = 'http://127.0.0.1:5005/api/extract';
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url
            })
        });

        if (!response.ok) {
            let errInfo = "Unknown error";
            try {
                const errData = await response.json();
                errInfo = errData.error || `HTTP ${response.status}`;
            } catch(e) {}
            throw new Error(`Python Backend API Error: ${errInfo}`);
        }

        const data = await response.json();
        
        if (data && data.url) {
            return data.url;
        }
        
        throw new Error("The backend did not return a valid URL format.");
    }

    function setLoading(isLoading) {
        if (isLoading) {
            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
            extractBtn.disabled = true;
            urlInput.disabled = true;
        } else {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            extractBtn.disabled = false;
            urlInput.disabled = false;
        }
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
    }
});
