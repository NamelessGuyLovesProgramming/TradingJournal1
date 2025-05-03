# -*- coding: utf-8 -*-
"""API routes for calculating and retrieving journal statistics."""

from flask import Blueprint, jsonify
from src import data_storage

stats_bp = Blueprint("stats_bp", __name__)


@stats_bp.route("/journals/<int:journal_id>/statistics", methods=["GET"])
def get_journal_statistics(journal_id):
    """Calculate and return statistics for a specific journal."""
    # Überprüfen, ob das Journal existiert
    journal = data_storage.get_journal(journal_id)
    if not journal:
        return jsonify({"error": "Journal not found"}), 404

    stats = data_storage.get_journal_statistics(journal_id)
    if not stats:
        return jsonify({"message": "No entries found for this journal to calculate statistics."}), 404

    return jsonify(stats)