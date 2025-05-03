# -*- coding: utf-8 -*-
"""API routes for managing Journals and their Checklist Templates."""

from flask import Blueprint, request, jsonify
from src.models import db, Journal, ChecklistItemTemplate

journal_bp = Blueprint("journal_bp", __name__)

# --- Journal Routes ---

@journal_bp.route("/journals", methods=["GET"])
def get_journals():
    """Get a list of all journals."""
    journals = Journal.query.order_by(Journal.name).all()
    return jsonify([{
        "id": j.id,
        "name": j.name,
        "description": j.description,
        "has_sl_tp_fields": j.has_sl_tp_fields,
        "created_at": j.created_at.isoformat()
    } for j in journals])

@journal_bp.route("/journals", methods=["POST"])
def create_journal():
    """Create a new journal."""
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Journal name is required"}), 400

    new_journal = Journal(
        name=data["name"],
        description=data.get("description"),
        has_sl_tp_fields=data.get("has_sl_tp_fields", False)
    )
    db.session.add(new_journal)
    db.session.commit()

    # Optionally add default checklist items from request
    checklist_items = data.get("checklist_templates", [])
    if isinstance(checklist_items, list):
        for idx, item_text in enumerate(checklist_items):
            if isinstance(item_text, str) and item_text.strip():
                template = ChecklistItemTemplate(
                    journal_id=new_journal.id,
                    text=item_text.strip(),
                    order=idx
                )
                db.session.add(template)
        db.session.commit() # Commit again after adding templates

    return jsonify({
        "id": new_journal.id,
        "name": new_journal.name,
        "description": new_journal.description,
        "has_sl_tp_fields": new_journal.has_sl_tp_fields,
        "created_at": new_journal.created_at.isoformat()
    }), 201

@journal_bp.route("/journals/<int:journal_id>", methods=["GET"])
def get_journal(journal_id):
    """Get details of a specific journal, including its checklist templates."""
    journal = Journal.query.get_or_404(journal_id)
    templates = ChecklistItemTemplate.query.filter_by(journal_id=journal.id).order_by(ChecklistItemTemplate.order).all()
    return jsonify({
        "id": journal.id,
        "name": journal.name,
        "description": journal.description,
        "has_sl_tp_fields": journal.has_sl_tp_fields,
        "created_at": journal.created_at.isoformat(),
        "checklist_templates": [{
            "id": t.id,
            "text": t.text,
            "order": t.order
        } for t in templates]
    })

@journal_bp.route("/journals/<int:journal_id>", methods=["PUT"])
def update_journal(journal_id):
    """Update an existing journal's details."""
    journal = Journal.query.get_or_404(journal_id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    if "name" in data:
        journal.name = data["name"]
    if "description" in data:
        journal.description = data["description"]
    if "has_sl_tp_fields" in data:
        journal.has_sl_tp_fields = data["has_sl_tp_fields"]

    db.session.commit()
    return jsonify({
        "id": journal.id,
        "name": journal.name,
        "description": journal.description,
        "has_sl_tp_fields": journal.has_sl_tp_fields
    })

@journal_bp.route("/journals/<int:journal_id>", methods=["DELETE"])
def delete_journal(journal_id):
    """Delete a journal and all its associated entries and templates."""
    journal = Journal.query.get_or_404(journal_id)
    # Cascading delete should handle entries, templates, statuses, images
    db.session.delete(journal)
    db.session.commit()
    return jsonify({"message": f"Journal {journal_id} deleted successfully"}), 200

# --- Checklist Template Routes (within a Journal) ---

@journal_bp.route("/journals/<int:journal_id>/checklist_templates", methods=["POST"])
def add_checklist_template(journal_id):
    """Add a new checklist item template to a journal."""
    journal = Journal.query.get_or_404(journal_id)
    data = request.get_json()
    if not data or not data.get("text"):
        return jsonify({"error": "Checklist item text is required"}), 400

    # Determine order (append to end)
    max_order = db.session.query(db.func.max(ChecklistItemTemplate.order)).filter_by(journal_id=journal_id).scalar()
    new_order = (max_order or -1) + 1

    template = ChecklistItemTemplate(
        journal_id=journal.id,
        text=data["text"].strip(),
        order=new_order
    )
    db.session.add(template)
    db.session.commit()
    return jsonify({"id": template.id, "text": template.text, "order": template.order}), 201

@journal_bp.route("/journals/<int:journal_id>/checklist_templates/<int:template_id>", methods=["PUT"])
def update_checklist_template(journal_id, template_id):
    """Update the text or order of a checklist item template."""
    template = ChecklistItemTemplate.query.filter_by(id=template_id, journal_id=journal_id).first_or_404()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    updated = False
    if "text" in data and data["text"].strip():
        template.text = data["text"].strip()
        updated = True
    # TODO: Add logic to handle reordering if 'order' is provided

    if updated:
        db.session.commit()
    return jsonify({"id": template.id, "text": template.text, "order": template.order})

@journal_bp.route("/journals/<int:journal_id>/checklist_templates/<int:template_id>", methods=["DELETE"])
def delete_checklist_template(journal_id, template_id):
    """Delete a checklist item template from a journal."""
    template = ChecklistItemTemplate.query.filter_by(id=template_id, journal_id=journal_id).first_or_404()
    # Need to also delete associated ChecklistItemStatus entries
    from src.models import ChecklistItemStatus
    ChecklistItemStatus.query.filter_by(template_id=template.id).delete()
    # Now delete the template itself
    db.session.delete(template)
    db.session.commit()
    return jsonify({"message": f"Checklist template {template_id} deleted"}), 200

