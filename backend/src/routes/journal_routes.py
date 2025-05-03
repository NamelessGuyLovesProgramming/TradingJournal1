# -*- coding: utf-8 -*-
"""API routes for managing Journals and their Checklist Templates."""

from flask import Blueprint, request, jsonify
from src import data_storage  # Importiere das neue Modul statt SQLAlchemy

journal_bp = Blueprint("journal_bp", __name__)


# --- Journal Routes ---

@journal_bp.route("/journals", methods=["GET"])
def get_journals():
    """Get a list of all journals."""
    journals = data_storage.get_journals()
    return jsonify(journals)


@journal_bp.route("/journals", methods=["POST"])
def create_journal():
    """Create a new journal."""
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Journal name is required"}), 400

    new_journal = data_storage.create_journal(data)
    return jsonify(new_journal), 201


@journal_bp.route("/journals/<int:journal_id>", methods=["GET"])
def get_journal(journal_id):
    """Get details of a specific journal, including its checklist templates."""
    journal = data_storage.get_journal(journal_id)
    if not journal:
        return jsonify({"error": "Journal not found"}), 404

    return jsonify(journal)


@journal_bp.route("/journals/<int:journal_id>", methods=["PUT"])
def update_journal(journal_id):
    """Update an existing journal's details."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    updated_journal = data_storage.update_journal(journal_id, data)
    if not updated_journal:
        return jsonify({"error": "Journal not found"}), 404

    return jsonify(updated_journal)


@journal_bp.route("/journals/<int:journal_id>", methods=["DELETE"])
def delete_journal(journal_id):
    """Delete a journal and all its associated entries and templates."""
    success = data_storage.delete_journal(journal_id)
    if success:
        return jsonify({"message": f"Journal {journal_id} deleted successfully"}), 200
    else:
        return jsonify({"error": "Journal not found"}), 404


# --- Checklist Template Routes (within a Journal) ---

@journal_bp.route("/journals/<int:journal_id>/checklist_templates", methods=["POST"])
def add_checklist_template(journal_id):
    """Add a new checklist item template to a journal."""
    data = request.get_json()
    if not data or not data.get("text"):
        return jsonify({"error": "Checklist item text is required"}), 400

    new_template = data_storage.add_checklist_template(journal_id, data)
    return jsonify(new_template), 201


@journal_bp.route("/journals/<int:journal_id>/checklist_templates/<int:template_id>", methods=["PUT"])
def update_checklist_template(journal_id, template_id):
    """Update the text or order of a checklist item template."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    updated_template = data_storage.update_checklist_template(template_id, data)
    if not updated_template:
        return jsonify({"error": "Template not found"}), 404

    return jsonify(updated_template)


@journal_bp.route("/journals/<int:journal_id>/checklist_templates/<int:template_id>", methods=["DELETE"])
def delete_checklist_template(journal_id, template_id):
    """Delete a checklist item template from a journal."""
    success = data_storage.delete_checklist_template(template_id)
    if success:
        return jsonify({"message": f"Checklist template {template_id} deleted"}), 200
    else:
        return jsonify({"error": "Template not found"}), 404


def create_journal(data):
    """Create a new journal."""
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Journal name is required"}), 400

    # Benutzerdefiniertes Feld kann optional hinzugefügt werden
    if 'has_custom_field' in data and data['has_custom_field'] and not data.get('custom_field_name'):
        return jsonify({"error": "Custom field name is required when has_custom_field is true"}), 400

    new_journal = data_storage.create_journal(data)
    return jsonify(new_journal), 201