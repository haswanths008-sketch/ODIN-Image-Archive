O.D.I.N. IMAGE ARCHIVE
=======================

This version is intentionally NOT an AI/object-detection dashboard.
It is a date-wise image archive for O.D.I.N.

What it does:
- Saves every uploaded/captured image.
- Automatically creates a folder for the capture date: uploads/YYYY-MM-DD/
- Never overwrites previous captures.
- Shows all captures grouped by date.
- Lets you search dates and open any image full-screen.
- Includes /api/upload for the ESP32-CAM. Send multipart/form-data with field name: image
- Includes /api/archive for the webpage gallery.

Run:
1. Open Command Prompt in this folder.
2. Create/activate your Python virtual environment if needed.
3. Install Flask and Werkzeug:
   pip install flask werkzeug
4. Start:
   python server.py
5. Open:
   http://127.0.0.1:5000

ESP32-CAM:
POST a JPEG/PNG/WEBP image as multipart/form-data to:
http://YOUR-PC-IP:5000/api/upload

The PC and ESP32-CAM should be on the same Wi-Fi network for local testing.
