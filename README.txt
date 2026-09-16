ROMANTIC BIRTHDAY WEBSITE — HTML, CSS, JAVASCRIPT

Files:
  index.html   — page structure, birthday message, and love letter
  style.css    — colors, typography, responsive layout, and animations
  script.js    — candles, microphone, reveal, confetti, and photo uploads
  cake.webp    — included birthday cake image

START
1. Extract all files into one folder and open that folder in VS Code.
2. For the most consistent experience, use the VS Code Live Server extension:
   right-click index.html and select Open with Live Server.
3. Alternatively, double-click index.html. The tap-to-blow option works without
   a microphone; microphone and browser storage support can vary on file URLs.

No React, npm, Node.js, or build process is required.

USE
Click Blow out the candles, allow your microphone, wait for the listening
message, then blow gently toward the microphone. Or use the tap button.
The birthday message and photo frames appear after the candles go out.
Click a frame to upload a JPG, PNG, or WebP photo under 8 MB.

PHOTOS
Uploaded photos are saved in IndexedDB in that browser. They are not uploaded
to a server and will not appear on another person's device when you share the
site. Clearing browser data removes them. If you want shared photos, bundle
them as image files in the project or connect a backend.

MICROPHONE
Microphone access normally requires localhost or HTTPS, plus browser/OS
permission. No audio is recorded or sent to a server. Blowing is detected by
sustained sound level, so other loud sounds may also trigger the candles.

CUSTOMIZE
Edit index.html for the message and letter. Edit the captions array in
script.js for photo captions. Edit style.css for colors, fonts and sizing.
If you replace cake.webp, update the flame positions in index.html.
Google Fonts need internet access; fallback fonts work offline.

This standalone copy is separate from your hosted birthday website.
