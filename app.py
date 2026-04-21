from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import traceback
import os

app = Flask(__name__)
# Enable CORS for all routes so our frontend can access it
CORS(app)

@app.route('/api/extract', methods=['POST'])
def extract_video():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'No URL provided'}), 400

    url = data['url']
    
    # Configure yt-dlp to silently extract info without downloading
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Use the direct video URL
            video_url = info.get('url')
            if video_url:
                return jsonify({'url': video_url})
            
            # If standard url is missing, check formats
            formats = info.get('formats', [])
            for f in reversed(formats):
                if f.get('vcodec') != 'none' and f.get('ext') == 'mp4':
                    return jsonify({'url': f.get('url')})
            
            return jsonify({'error': 'Could not extract MP4 link from this video.'}), 404
            
    except Exception as e:
        error_message = str(e)
        print("Extraction Error:", traceback.format_exc())
        return jsonify({'error': f"Failed to extract: {error_message}"}), 500

if __name__ == '__main__':
    # Run the server locally on port 5005
    port = int(os.environ.get('PORT', 5005))
    app.run(debug=True, host='0.0.0.0', port=port)
