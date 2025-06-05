#!/bin/bash

# Script to embed your not_found.mp4 file into the STRM handler
# Usage: ./embed-error-video.sh path/to/your/not_found.mp4

if [ $# -eq 0 ]; then
    echo "Usage: $0 <path-to-not_found.mp4>"
    echo ""
    echo "This script will:"
    echo "1. Convert your video file to base64"
    echo "2. Update the STRM handler to use your video"
    echo "3. Ensure the file is under 25KB for optimal performance"
    exit 1
fi

VIDEO_FILE="$1"

if [ ! -f "$VIDEO_FILE" ]; then
    echo "Error: File '$VIDEO_FILE' not found"
    exit 1
fi

# Check file size (25KB = 25600 bytes)
FILE_SIZE=$(stat -f%z "$VIDEO_FILE" 2>/dev/null || stat -c%s "$VIDEO_FILE" 2>/dev/null)
if [ "$FILE_SIZE" -gt 25600 ]; then
    echo "Warning: File is ${FILE_SIZE} bytes (>25KB). This may impact Worker performance."
    echo "Consider compressing the video for better performance."
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

echo "Converting $VIDEO_FILE to base64..."

# Convert to base64
BASE64_DATA=$(base64 -i "$VIDEO_FILE" | tr -d '\n')

# Create the data URL
DATA_URL="data:video/mp4;base64,$BASE64_DATA"

# Update the STRM handler file
echo "Updating src/strm-handler.ts..."

# Create a backup
cp src/strm-handler.ts src/strm-handler.ts.backup

# Replace the ERROR_VIDEO_BASE64 constant
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|const ERROR_VIDEO_BASE64 = .*|const ERROR_VIDEO_BASE64 = \`$DATA_URL\`;|" src/strm-handler.ts
else
    # Linux
    sed -i "s|const ERROR_VIDEO_BASE64 = .*|const ERROR_VIDEO_BASE64 = \`$DATA_URL\`;|" src/strm-handler.ts
fi

echo "✅ Video embedded successfully!"
echo ""
echo "File size: $FILE_SIZE bytes"
echo "Base64 size: ${#DATA_URL} characters"
echo ""
echo "Your error video is now embedded in the STRM handler."
echo "Run 'npm run deploy' to update your production deployment."
echo ""
echo "Backup saved as: src/strm-handler.ts.backup"
