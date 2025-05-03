# -*- coding: utf-8 -*-
"""API routes for managing Journal Entries, Checklist Statuses, and Images."""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from src.models import db, Journal, JournalEntry, ChecklistItemTemplate, ChecklistItemStatus, EntryImage

entry_bp = Blueprint("entry_bp", __name__)

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Journal Entry Routes ---

@entry_bp.route("/journals/<int:journal_id>/entries", methods=["GET"])
def get_journal_entries(journal_id):
    """Get all entries for a specific journal."""
    # Ensure journal exists
    Journal.query.get_or_404(journal_id)
    entries = JournalEntry.query.filter_by(journal_id=journal_id).order_by(JournalEntry.entry_date.desc()).all()

    result = []
    for entry in entries:
        entry_data = {
            "id": entry.id,
            "journal_id": entry.journal_id,
            "entry_date": entry.entry_date.isoformat(),
            "symbol": entry.symbol, # New
            "position_type": entry.position_type, # New
            "strategy": entry.strategy,
            "initial_rr": entry.initial_rr, # New
            "pnl": entry.pnl,
            "result": entry.result,
            "confidence_level": entry.confidence_level,
            "trade_rating": entry.trade_rating,
            "notes": entry.notes,
            "stop_loss": entry.stop_loss,
            "take_profit": entry.take_profit
        }
        result.append(entry_data)

    return jsonify(result)

@entry_bp.route("/journals/<int:journal_id>/entries", methods=["POST"])
def create_journal_entry(journal_id):
    """Create a new entry in a specific journal."""
    journal = Journal.query.get_or_404(journal_id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    new_entry = JournalEntry(
        journal_id=journal.id,
        symbol=data.get("symbol"), # New
        position_type=data.get("position_type"), # New
        strategy=data.get("strategy"),
        initial_rr=data.get("initial_rr"), # New
        pnl=data.get("pnl"),
        result=data.get("result"),
        confidence_level=data.get("confidence_level"),
        trade_rating=data.get("trade_rating"),
        notes=data.get("notes"),
        stop_loss=data.get("stop_loss") if journal.has_sl_tp_fields else None,
        take_profit=data.get("take_profit") if journal.has_sl_tp_fields else None
        # entry_date defaults to now
    )
    db.session.add(new_entry)
    db.session.flush() # Flush to get the new_entry.id

    # Create initial checklist statuses based on journal templates
    templates = ChecklistItemTemplate.query.filter_by(journal_id=journal.id).all()
    initial_statuses = data.get("checklist_statuses", {})
    for template in templates:
        status = ChecklistItemStatus(
            entry_id=new_entry.id,
            template_id=template.id,
            checked=initial_statuses.get(str(template.id), False) # Get initial state from request if provided
        )
        db.session.add(status)

    db.session.commit()

    # Return the full entry details
    # Use the get_journal_entry function to ensure consistency
    response, status_code = get_journal_entry(new_entry.id)
    return response, status_code # Pass along the response and status code


@entry_bp.route("/entries/<int:entry_id>", methods=["GET"])
def get_journal_entry(entry_id):
    """Get details of a specific journal entry, including checklist and images."""
    entry = JournalEntry.query.get_or_404(entry_id)
    statuses = ChecklistItemStatus.query.join(ChecklistItemTemplate).filter(ChecklistItemStatus.entry_id == entry.id).order_by(ChecklistItemTemplate.order).all()
    images = EntryImage.query.filter_by(entry_id=entry.id).order_by(EntryImage.uploaded_at).all()

    return jsonify({
        "id": entry.id,
        "journal_id": entry.journal_id,
        "entry_date": entry.entry_date.isoformat(),
        "symbol": entry.symbol, # New
        "position_type": entry.position_type, # New
        "strategy": entry.strategy,
        "initial_rr": entry.initial_rr, # New
        "pnl": entry.pnl,
        "result": entry.result,
        "confidence_level": entry.confidence_level,
        "trade_rating": entry.trade_rating,
        "notes": entry.notes,
        "stop_loss": entry.stop_loss,
        "take_profit": entry.take_profit,
        "checklist_statuses": [{
            "template_id": s.template_id,
            "text": s.template.text, # Include text for convenience
            "checked": s.checked,
            "order": s.template.order # Include order for sorting
        } for s in statuses],
        "images": [{
            "id": img.id,
            "file_path": f"/api/uploads/{img.file_path}", # Construct URL
            "category": img.category, # New
            "uploaded_at": img.uploaded_at.isoformat()
        } for img in images]
    }), 200 # Explicitly return 200 OK

@entry_bp.route("/entries/<int:entry_id>", methods=["PUT"])
def update_journal_entry(entry_id):
    """Update an existing journal entry."""
    entry = JournalEntry.query.get_or_404(entry_id)
    journal = Journal.query.get_or_404(entry.journal_id) # Needed for SL/TP check
    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    # Update fields
    if "symbol" in data: entry.symbol = data["symbol"] # New
    if "position_type" in data: entry.position_type = data["position_type"] # New
    if "strategy" in data: entry.strategy = data["strategy"]
    if "initial_rr" in data: entry.initial_rr = data["initial_rr"] # New
    if "pnl" in data: entry.pnl = data["pnl"]
    if "result" in data: entry.result = data["result"]
    if "confidence_level" in data: entry.confidence_level = data["confidence_level"]
    if "trade_rating" in data: entry.trade_rating = data["trade_rating"]
    if "notes" in data: entry.notes = data["notes"]
    if journal.has_sl_tp_fields:
        if "stop_loss" in data: entry.stop_loss = data["stop_loss"]
        if "take_profit" in data: entry.take_profit = data["take_profit"]

    # Update checklist statuses
    if "checklist_statuses" in data and isinstance(data["checklist_statuses"], dict):
        for template_id_str, checked_status in data["checklist_statuses"].items():
            try:
                template_id = int(template_id_str)
                status = ChecklistItemStatus.query.filter_by(entry_id=entry.id, template_id=template_id).first()
                if status and isinstance(checked_status, bool):
                    status.checked = checked_status
            except ValueError:
                continue # Ignore invalid template_id keys

    db.session.commit()
    return get_journal_entry(entry_id) # Return updated entry

@entry_bp.route("/entries/<int:entry_id>", methods=["DELETE"])
def delete_journal_entry(entry_id):
    """Delete a journal entry and its associated statuses and images."""
    entry = JournalEntry.query.get_or_404(entry_id)

    # Delete associated images from filesystem first
    images = EntryImage.query.filter_by(entry_id=entry.id).all()
    upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
    for img in images:
        try:
            os.remove(os.path.join(upload_dir, img.file_path))
        except OSError as e:
            current_app.logger.error(f"Error deleting image file {img.file_path}: {e}")
            # Continue deletion even if file removal fails

    # Cascading delete should handle statuses and images in DB
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": f"Journal entry {entry_id} deleted successfully"}), 200

# --- Checklist Status Route ---

@entry_bp.route("/entries/<int:entry_id>/checklist/<int:template_id>", methods=["PUT"])
def update_checklist_status(entry_id, template_id):
    """Update the checked status of a specific checklist item for an entry."""
    status = ChecklistItemStatus.query.filter_by(entry_id=entry_id, template_id=template_id).first_or_404()
    data = request.get_json()
    if not data or "checked" not in data or not isinstance(data["checked"], bool):
        return jsonify({"error": "Invalid data: boolean 'checked' status required"}), 400

    status.checked = data["checked"]
    db.session.commit()
    return jsonify({"template_id": status.template_id, "checked": status.checked})

# --- Image Upload/Delete Routes ---

@entry_bp.route("/entries/<int:entry_id>/images", methods=["POST"])
def upload_entry_image(entry_id):
    """Upload an image for a specific journal entry."""
    entry = JournalEntry.query.get_or_404(entry_id)

    if "image" not in request.files:
        return jsonify({"error": "No image file part"}), 400
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Get category from form data (optional)
    category = request.form.get("category", "General")
    if category not in ["Before", "After", "General"]:
        category = "General" # Default to General if invalid category provided

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Create unique filename to avoid conflicts
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
        os.makedirs(upload_dir, exist_ok=True) # Ensure upload directory exists
        file_path = os.path.join(upload_dir, unique_filename)

        try:
            file.save(file_path)
            new_image = EntryImage(entry_id=entry.id, file_path=unique_filename, category=category) # Save category
            db.session.add(new_image)
            db.session.commit()
            return jsonify({
                "id": new_image.id,
                "file_path": f"/api/uploads/{new_image.file_path}",
                "category": new_image.category, # Return category
                "uploaded_at": new_image.uploaded_at.isoformat()
            }), 201
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving image or DB record: {e}")
            # Clean up saved file if DB operation failed
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({"error": "Failed to save image"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

@entry_bp.route("/images/<int:image_id>", methods=["DELETE"])
def delete_entry_image(image_id):
    """Delete a specific image associated with an entry."""
    image = EntryImage.query.get_or_404(image_id)
    upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
    file_path = os.path.join(upload_dir, image.file_path)

    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        else:
             current_app.logger.warning(f"Image file not found for deletion: {file_path}")
        db.session.delete(image)
        db.session.commit()
        return jsonify({"message": f"Image {image_id} deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting image {image_id}: {e}")
        return jsonify({"error": "Failed to delete image"}), 500

# Route to serve uploaded files
@entry_bp.route("/uploads/<path:filename>")
def serve_upload(filename):
    upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
    # Add security check: ensure filename is safe
    safe_path = os.path.abspath(os.path.join(upload_dir, filename))
    if not safe_path.startswith(os.path.abspath(upload_dir)):
        return jsonify({"error": "Invalid file path"}), 400
    return send_from_directory(upload_dir, filename)

