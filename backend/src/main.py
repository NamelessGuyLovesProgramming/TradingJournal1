# src/main.py - Angepasst für reine API-Funktion

import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from flask import Flask, jsonify, send_from_directory
from flask import Flask, jsonify
from flask_cors import CORS  # Add this import

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Importiere die Route-Definitionen
from src.routes.journal_routes import journal_bp
from src.routes.entry_routes import entry_bp
from src.routes.stats_routes import stats_bp

# Registriere die Blueprints
app.register_blueprint(journal_bp, url_prefix='/api')
app.register_blueprint(entry_bp, url_prefix='/api')
app.register_blueprint(stats_bp, url_prefix='/api')

# Entfernt: Die Routen für statische Dateien

# Route zum Bereitstellen hochgeladener Dateien (wird für die API benötigt)
@app.route('/api/uploads/<path:filename>')
def serve_upload(filename):
    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'uploads')
    # Sicherheitsprüfung: sicherstellen, dass der Dateiname sicher ist
    safe_path = os.path.abspath(os.path.join(upload_dir, filename))
    if not safe_path.startswith(os.path.abspath(upload_dir)):
        return jsonify({"error": "Ungültiger Dateipfad"}), 400
    return send_from_directory(upload_dir, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)