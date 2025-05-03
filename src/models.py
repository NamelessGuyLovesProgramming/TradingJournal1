# -*- coding: utf-8 -*-
"""Database models for the Trading Journal application."""
import datetime
import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Journal(db.Model):
    """Represents a single trading journal (e.g., for a specific strategy)."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    has_sl_tp_fields = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Relationships
    entries = db.relationship("JournalEntry", backref="journal", lazy=True, cascade="all, delete-orphan")
    checklist_templates = db.relationship("ChecklistItemTemplate", backref="journal", lazy=True, cascade="all, delete-orphan")

class ChecklistItemTemplate(db.Model):
    """Template for a checklist item within a specific journal."""
    id = db.Column(db.Integer, primary_key=True)
    journal_id = db.Column(db.Integer, db.ForeignKey("journal.id"), nullable=False)
    text = db.Column(db.String(255), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0) # To maintain order

class JournalEntry(db.Model):
    """Represents a single trade entry in a journal."""
    id = db.Column(db.Integer, primary_key=True)
    journal_id = db.Column(db.Integer, db.ForeignKey("journal.id"), nullable=False)
    entry_date = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    symbol = db.Column(db.String(50), nullable=True) # New: Trading symbol (e.g., NQ1!, ES, AAPL)
    position_type = db.Column(db.Enum("Long", "Short", name="position_type_enum"), nullable=True) # New: Long or Short
    strategy = db.Column(db.String(150), nullable=True) # Keep optional as discussed
    initial_rr = db.Column(db.Float, nullable=True) # New: Initial Risk/Reward Ratio
    pnl = db.Column(db.Float, nullable=True) # Profit and Loss
    result = db.Column(db.Enum("Win", "Loss", "BE", "PartialBE", name="trade_result_enum"), nullable=True)
    confidence_level = db.Column(db.Integer, nullable=True) # 1-100
    trade_rating = db.Column(db.Float, nullable=True) # 1.0 - 5.0
    notes = db.Column(db.Text, nullable=True)
    stop_loss = db.Column(db.Float, nullable=True)
    take_profit = db.Column(db.Float, nullable=True)

    # Relationships
    checklist_statuses = db.relationship("ChecklistItemStatus", backref="entry", lazy=True, cascade="all, delete-orphan")
    images = db.relationship("EntryImage", backref="entry", lazy=True, cascade="all, delete-orphan")

class ChecklistItemStatus(db.Model):
    """Status (checked/unchecked) of a checklist item for a specific entry."""
    id = db.Column(db.Integer, primary_key=True)
    entry_id = db.Column(db.Integer, db.ForeignKey("journal_entry.id"), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey("checklist_item_template.id"), nullable=False)
    checked = db.Column(db.Boolean, default=False, nullable=False)

    # Relationship to get template text easily if needed
    template = db.relationship("ChecklistItemTemplate", lazy=True)

class EntryImage(db.Model):
    """Represents an image uploaded for a journal entry."""
    id = db.Column(db.Integer, primary_key=True)
    entry_id = db.Column(db.Integer, db.ForeignKey("journal_entry.id"), nullable=False)
    file_path = db.Column(db.String(255), nullable=False) # Path relative to an upload folder
    category = db.Column(db.Enum("Before", "After", "General", name="image_category_enum"), default="General", nullable=False) # New: Image category
    uploaded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

