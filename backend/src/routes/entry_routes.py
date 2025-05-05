# -*- coding: utf-8 -*-
"""API routes for managing Journal Entries, Checklist Statuses, and Images."""

import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from src import data_storage

entry_bp = Blueprint("entry_bp", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def allowed_file(filename):
    return "." in filename and \
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# --- Strategie-Routes ---

@entry_bp.route("/strategies", methods=["GET"])
def get_strategies():
    """Get all available strategies."""
    strategies = data_storage.get_strategies()
    return jsonify(strategies)


@entry_bp.route("/strategies", methods=["POST"])
def add_strategy():
    """Add a new strategy."""
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Strategy name is required"}), 400

    new_strategy = data_storage.add_strategy(data["name"])
    return jsonify(new_strategy), 201


# --- Journal Entry Routes ---

@entry_bp.route("/journals/<int:journal_id>/entries", methods=["GET"])
def get_journal_entries(journal_id):
    """Get all entries for a specific journal."""
    # Stellen Sie sicher, dass das Journal existiert
    journal = data_storage.get_journal(journal_id)
    if not journal:
        return jsonify({"error": "Journal not found"}), 404

    entries = data_storage.get_entries(journal_id)
    return jsonify(entries)

@entry_bp.route("/entries/<int:entry_id>/links", methods=["POST"])
def add_entry_link(entry_id):
    """Add a link for a specific journal entry."""
    entry = data_storage.get_entry(entry_id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    data = request.get_json()
    if not data or not data.get("url"):
        return jsonify({"error": "URL is required"}), 400

    category = data.get("category", "Before")
    if category not in ["Before", "After"]:
        category = "Before"  # Default category

    new_link = data_storage.upload_image(entry_id, file=None, category=category, link_url=data.get("url"))
    if new_link:
        return jsonify(new_link), 201
    else:
        return jsonify({"error": "Failed to save link"}), 500

@entry_bp.route("/journals/<int:journal_id>/entries", methods=["POST"])
def create_journal_entry(journal_id):
    """Create a new entry in a specific journal."""
    journal = data_storage.get_journal(journal_id)
    if not journal:
        return jsonify({"error": "Journal not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    entry = data_storage.create_entry(journal_id, data)
    return jsonify(entry), 201


@entry_bp.route("/entries/<int:entry_id>/links", methods=["POST"])
def add_entry_link_url(entry_id):
    """Add a link for a specific journal entry."""
    entry = data_storage.get_entry(entry_id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    data = request.get_json()
    if not data or not data.get("url"):
        return jsonify({"error": "URL is required"}), 400

    category = data.get("category", "Before")
    if category not in ["Before", "After"]:
        category = "Before"  # Default category

    new_link = data_storage.upload_image(entry_id, file=None, category=category, link_url=data.get("url"))
    if new_link:
        return jsonify(new_link), 201
    else:
        return jsonify({"error": "Failed to save link"}), 500

@entry_bp.route("/entries/<int:entry_id>", methods=["GET"])
def get_journal_entry(entry_id):
    """Get details of a specific journal entry, including checklist and images."""
    entry = data_storage.get_entry(entry_id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    return jsonify(entry), 200


@entry_bp.route("/entries/<int:entry_id>", methods=["PUT"])
def update_journal_entry(entry_id):
    """Update an existing journal entry."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    updated_entry = data_storage.update_entry(entry_id, data)
    if not updated_entry:
        return jsonify({"error": "Entry not found"}), 404

    return jsonify(updated_entry)


@entry_bp.route("/entries/<int:entry_id>", methods=["DELETE"])
def delete_journal_entry(entry_id):
    """Delete a journal entry and its associated statuses and images."""
    success = data_storage.delete_entry(entry_id)
    if success:
        return jsonify({"message": f"Journal entry {entry_id} deleted successfully"}), 200
    else:
        return jsonify({"error": "Entry not found"}), 404


# --- Checklist Status Route ---

@entry_bp.route("/entries/<int:entry_id>/checklist/<int:template_id>", methods=["PUT"])
def update_checklist_status(entry_id, template_id):
    """Update the checked status of a specific checklist item for an entry."""
    data = request.get_json()
    if not data or "checked" not in data or not isinstance(data["checked"], bool):
        return jsonify({"error": "Invalid data: boolean 'checked' status required"}), 400

    status = data_storage.update_checklist_status(entry_id, template_id, data["checked"])
    if not status:
        return jsonify({"error": "Status not found"}), 404

    return jsonify({"template_id": template_id, "checked": status["checked"]})


# --- Image Upload/Delete Routes ---

@entry_bp.route("/entries/<int:entry_id>/images", methods=["POST"])
def upload_entry_image(entry_id):
    """Upload an image for a specific journal entry."""
    entry = data_storage.get_entry(entry_id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    if "image" not in request.files:
        return jsonify({"error": "No image file part"}), 400
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Get category from form data (only Before or After)
    category = request.form.get("category", "Before")
    if category not in ["Before", "After"]:
        category = "Before"  # Standard ist jetzt "Before" statt "General"

    if file and allowed_file(file.filename):
        new_image = data_storage.upload_image(entry_id, file, category)
        if new_image:
            return jsonify(new_image), 201
        else:
            return jsonify({"error": "Failed to save image"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400


@entry_bp.route("/images/<int:image_id>", methods=["DELETE"])
def delete_entry_image(image_id):
    """Delete a specific image associated with an entry."""
    success = data_storage.delete_image(image_id)
    if success:
        return jsonify({"message": f"Image {image_id} deleted successfully"}), 200
    else:
        return jsonify({"error": "Image not found"}), 404