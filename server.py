from flask import Flask, render_template, request, jsonify, send_from_directory, abort
from werkzeug.utils import secure_filename
from datetime import datetime
from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_capture(file):
    """Save every capture inside uploads/YYYY-MM-DD/ without replacing old images."""
    now = datetime.now().astimezone()
    date_folder = now.strftime("%Y-%m-%d")
    date_dir = UPLOAD_DIR / date_folder
    date_dir.mkdir(parents=True, exist_ok=True)

    original = secure_filename(file.filename or "capture.jpg")
    ext = Path(original).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        ext = ".jpg"

    filename = now.strftime("%H-%M-%S_%f")[:-3] + ext
    destination = date_dir / filename
    file.save(destination)

    return {
        "date": date_folder,
        "filename": filename,
        "captured_at": now.strftime("%d %b %Y, %I:%M:%S %p"),
        "timestamp": now.isoformat(),
        "url": f"/image/{date_folder}/{filename}",
    }


def build_archive():
    groups = []
    total = 0

    for date_dir in sorted(UPLOAD_DIR.iterdir(), reverse=True):
        if not date_dir.is_dir():
            continue
        images = []
        for path in sorted(date_dir.iterdir(), reverse=True):
            if path.suffix.lower().lstrip(".") not in ALLOWED_EXTENSIONS:
                continue
            stat = path.stat()
            captured = datetime.fromtimestamp(stat.st_mtime).astimezone()
            images.append({
                "filename": path.name,
                "url": f"/image/{date_dir.name}/{path.name}",
                "time": captured.strftime("%I:%M:%S %p"),
                "timestamp": captured.isoformat(),
            })
        if images:
            groups.append({
                "date": date_dir.name,
                "display_date": datetime.strptime(date_dir.name, "%Y-%m-%d").strftime("%A, %d %B %Y"),
                "images": images,
                "count": len(images),
            })
            total += len(images)

    today = datetime.now().astimezone().strftime("%Y-%m-%d")
    today_count = next((group["count"] for group in groups if group["date"] == today), 0)
    return {"groups": groups, "total": total, "today": today_count}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
@app.route("/api/upload", methods=["POST"])
def upload():
    if "image" not in request.files:
        return jsonify({"ok": False, "error": "No image field received."}), 400

    file = request.files["image"]
    if not file.filename:
        return jsonify({"ok": False, "error": "No file selected."}), 400
    if not allowed_file(file.filename):
        return jsonify({"ok": False, "error": "Only JPG, JPEG, PNG and WEBP images are allowed."}), 400

    capture = save_capture(file)
    return jsonify({"ok": True, **capture})


@app.route("/api/archive")
def archive():
    return jsonify(build_archive())


@app.route("/image/<date>/<filename>")
def image(date, filename):
    # Only allow an existing YYYY-MM-DD directory and a safe filename.
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        abort(404)
    safe_name = secure_filename(filename)
    if safe_name != filename:
        abort(404)
    return send_from_directory(UPLOAD_DIR / date, safe_name)


@app.route("/api/status")
def status():
    data = build_archive()
    latest = None
    if data["groups"]:
        latest_group = data["groups"][0]
        if latest_group["images"]:
            latest = latest_group["images"][0]
    return jsonify({"online": True, "latest": latest, "total": data["total"], "today": data["today"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
