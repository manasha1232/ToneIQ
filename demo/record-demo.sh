#!/usr/bin/env bash
# Generates a demo GIF/video using ffmpeg screen capture (macOS/Linux)
# Requires: ffmpeg installed

echo "🎬 ToneIQ Demo Recorder"
echo "1. Make sure 'npm run dev' is running in both frontend and backend"
echo "2. Open http://localhost:5173 in Chrome"
echo "3. Press ENTER when ready to start capture (30 seconds)"
read -r

OUTPUT="demo-$(date +%Y%m%d-%H%M%S).mp4"

if [[ "$OSTYPE" == "darwin"* ]]; then
  ffmpeg -f avfoundation -i "1" -t 90 -r 30 -vf scale=1280:720 "$OUTPUT"
else
  ffmpeg -f x11grab -i :0.0 -t 90 -r 30 -vf scale=1280:720 "$OUTPUT"
fi

echo "✅ Demo saved to $OUTPUT"
echo "Upload this as your portfolio demo video."
