# -*- coding: utf-8 -*-
"""API routes for calculating and retrieving journal statistics."""

from flask import Blueprint, jsonify
from sqlalchemy import func, case
from src.models import db, Journal, JournalEntry, ChecklistItemTemplate, ChecklistItemStatus

stats_bp = Blueprint("stats_bp", __name__)

@stats_bp.route("/journals/<int:journal_id>/statistics", methods=["GET"])
def get_journal_statistics(journal_id):
    """Calculate and return statistics for a specific journal."""
    journal = Journal.query.get_or_404(journal_id)
    entries = JournalEntry.query.filter_by(journal_id=journal_id).all()

    if not entries:
        return jsonify({"message": "No entries found for this journal to calculate statistics."}), 404

    total_trades = len(entries)
    wins = sum(1 for e in entries if e.result == "Win")
    losses = sum(1 for e in entries if e.result == "Loss")
    bes = sum(1 for e in entries if e.result == "BE")
    partial_bes = sum(1 for e in entries if e.result == "PartialBE")

    win_rate = (wins / total_trades * 100) if total_trades > 0 else 0

    long_positions = sum(1 for e in entries if e.position_type == "Long")
    short_positions = sum(1 for e in entries if e.position_type == "Short")

    total_pnl = sum(e.pnl for e in entries if e.pnl is not None)
    avg_pnl = total_pnl / total_trades if total_trades > 0 else 0

    winning_trades = [e.pnl for e in entries if e.result == "Win" and e.pnl is not None]
    losing_trades = [e.pnl for e in entries if e.result == "Loss" and e.pnl is not None]

    avg_win_pnl = sum(winning_trades) / len(winning_trades) if winning_trades else 0
    avg_loss_pnl = sum(losing_trades) / len(losing_trades) if losing_trades else 0

    initial_rrs = [e.initial_rr for e in entries if e.initial_rr is not None]
    avg_initial_rr = sum(initial_rrs) / len(initial_rrs) if initial_rrs else 0

    # Checklist item usage
    checklist_usage = db.session.query(
        ChecklistItemTemplate.text,
        func.count(ChecklistItemStatus.id).label("total"),
        func.sum(case((ChecklistItemStatus.checked == True, 1), else_=0)).label("checked_count")
    ).join(ChecklistItemStatus, ChecklistItemStatus.template_id == ChecklistItemTemplate.id)\
    .join(JournalEntry, JournalEntry.id == ChecklistItemStatus.entry_id)\
    .filter(JournalEntry.journal_id == journal_id)\
    .group_by(ChecklistItemTemplate.id, ChecklistItemTemplate.text)\
    .order_by(ChecklistItemTemplate.order)\
    .all()

    checklist_stats = [{
        "text": item.text,
        "checked_percentage": (item.checked_count / item.total * 100) if item.total > 0 else 0,
        "checked_count": item.checked_count,
        "total_entries_with_item": item.total
    } for item in checklist_usage]

    # Performance by Symbol (Basic count)
    symbol_performance = db.session.query(
        JournalEntry.symbol,
        func.count(JournalEntry.id).label("count"),
        func.sum(case((JournalEntry.result == "Win", 1), else_=0)).label("wins"),
        func.sum(case((JournalEntry.result == "Loss", 1), else_=0)).label("losses")
        # Add more calculations like avg PnL per symbol if needed
    ).filter(JournalEntry.journal_id == journal_id, JournalEntry.symbol != None)\
    .group_by(JournalEntry.symbol)\
    .order_by(func.count(JournalEntry.id).desc())\
    .all()

    symbol_stats = [{
        "symbol": item.symbol,
        "count": item.count,
        "wins": item.wins,
        "losses": item.losses,
        "win_rate": (item.wins / item.count * 100) if item.count > 0 else 0
    } for item in symbol_performance]

    stats = {
        "journal_name": journal.name,
        "total_trades": total_trades,
        "win_rate_percentage": round(win_rate, 2),
        "results_count": {
            "Win": wins,
            "Loss": losses,
            "BE": bes,
            "PartialBE": partial_bes
        },
        "position_type_count": {
            "Long": long_positions,
            "Short": short_positions
        },
        "average_pnl": round(avg_pnl, 2),
        "average_winning_pnl": round(avg_win_pnl, 2),
        "average_losing_pnl": round(avg_loss_pnl, 2),
        "average_initial_rr": round(avg_initial_rr, 1) if avg_initial_rr is not None else None,
        "checklist_usage": checklist_stats,
        "symbol_performance": symbol_stats
        # Add more stats here (e.g., by time, day)
    }

    return jsonify(stats)

