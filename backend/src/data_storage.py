# src/data_storage.py - Aktualisierte Version mit neuen Feldern

import os
import json
import datetime
import uuid
from pathlib import Path
import shutil

# Basispfad für die Datenspeicherung
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
UPLOADS_DIR = os.path.join(DATA_DIR, 'uploads')

# Stellen Sie sicher, dass die Verzeichnisse existieren
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Pfade zu JSON-Dateien
JOURNALS_FILE = os.path.join(DATA_DIR, 'journals.json')
ENTRIES_FILE = os.path.join(DATA_DIR, 'entries.json')
TEMPLATES_FILE = os.path.join(DATA_DIR, 'templates.json')
STATUSES_FILE = os.path.join(DATA_DIR, 'statuses.json')
IMAGES_FILE = os.path.join(DATA_DIR, 'images.json')
STRATEGIES_FILE = os.path.join(DATA_DIR, 'strategies.json')  # Neue Datei für Strategien


# Initialisieren Sie die Dateien, falls sie nicht existieren
def init_data_files():
    """Erstellt leere JSON-Dateien, falls diese noch nicht existieren."""
    files = {
        JOURNALS_FILE: [],
        ENTRIES_FILE: [],
        TEMPLATES_FILE: [],
        STATUSES_FILE: [],
        IMAGES_FILE: [],
        STRATEGIES_FILE: []  # Füge die neue Strategien-Datei hinzu
    }

    for file_path, default_data in files.items():
        if not os.path.exists(file_path):
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(default_data, f, ensure_ascii=False, indent=2)


def load_data(file_path):
    """Lädt Daten aus einer JSON-Datei."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Falls die Datei nicht existiert oder beschädigt ist
        return []


def save_data(file_path, data):
    """Speichert Daten in einer JSON-Datei."""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, ensure_ascii=False, indent=2, fp=f, default=json_serialize)


def json_serialize(obj):
    """Hilft beim Serialisieren von Datumswerten für JSON."""
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


# Journal-Funktionen
def get_journals():
    """Gibt alle Journals zurück."""
    return load_data(JOURNALS_FILE)


def get_journal(journal_id):
    """Gibt ein bestimmtes Journal und seine Checklistenvorlagen zurück."""
    journals = load_data(JOURNALS_FILE)
    journal = next((j for j in journals if j['id'] == journal_id), None)

    if journal:
        templates = load_data(TEMPLATES_FILE)
        journal_templates = [t for t in templates if t['journal_id'] == journal_id]
        journal['checklist_templates'] = sorted(journal_templates, key=lambda x: x['order'])

    return journal


def create_journal(data):
    """Erstellt ein neues Journal."""
    journals = load_data(JOURNALS_FILE)

    # Generiere eine eindeutige ID
    new_id = 1
    if journals:
        new_id = max(j['id'] for j in journals) + 1

    current_time = datetime.datetime.utcnow().isoformat()

    new_journal = {
        'id': new_id,
        'name': data['name'],
        'description': data.get('description', ''),
        'has_sl_tp_fields': data.get('has_sl_tp_fields', False),
        'has_custom_field': data.get('has_custom_field', False),  # Neues Feld für benutzerdefiniertes Dropdown
        'custom_field_name': data.get('custom_field_name', ''),  # Name des benutzerdefinierten Feldes
        'custom_field_options': data.get('custom_field_options', []),  # Optionen für das benutzerdefinierte Feld
        'created_at': current_time
    }

    journals.append(new_journal)
    save_data(JOURNALS_FILE, journals)

    # Erstelle Checklistenvorlagen, wenn vorhanden
    checklist_items = data.get('checklist_templates', [])
    if isinstance(checklist_items, list):
        templates = load_data(TEMPLATES_FILE)
        for idx, text in enumerate(checklist_items):
            template_id = 1
            if templates:
                template_id = max(t.get('id', 0) for t in templates) + 1

            templates.append({
                'id': template_id,
                'journal_id': new_id,
                'text': text,
                'order': idx
            })

        save_data(TEMPLATES_FILE, templates)

    return new_journal


def update_journal(journal_id, data):
    """Aktualisiert ein bestehendes Journal."""
    journals = load_data(JOURNALS_FILE)
    for journal in journals:
        if journal['id'] == journal_id:
            if 'name' in data:
                journal['name'] = data['name']
            if 'description' in data:
                journal['description'] = data['description']
            if 'has_sl_tp_fields' in data:
                journal['has_sl_tp_fields'] = data['has_sl_tp_fields']
            if 'has_custom_field' in data:
                journal['has_custom_field'] = data['has_custom_field']
            if 'custom_field_name' in data:
                journal['custom_field_name'] = data['custom_field_name']
            if 'custom_field_options' in data:
                journal['custom_field_options'] = data['custom_field_options']

            save_data(JOURNALS_FILE, journals)
            return journal

    return None


def delete_journal(journal_id):
    """Löscht ein Journal und alle zugehörigen Daten."""
    journals = load_data(JOURNALS_FILE)
    journals = [j for j in journals if j['id'] != journal_id]
    save_data(JOURNALS_FILE, journals)

    # Lösche zugehörige Vorlagen
    templates = load_data(TEMPLATES_FILE)
    templates = [t for t in templates if t['journal_id'] != journal_id]
    save_data(TEMPLATES_FILE, templates)

    # Finde Einträge, die zum Journal gehören
    entries = load_data(ENTRIES_FILE)
    entry_ids = [e['id'] for e in entries if e['journal_id'] == journal_id]
    entries = [e for e in entries if e['journal_id'] != journal_id]
    save_data(ENTRIES_FILE, entries)

    # Lösche Checklistenstatus und Bilder für die Einträge
    delete_related_entry_data(entry_ids)

    return True


# Strategie-Funktionen
def get_strategies():
    """Gibt alle verfügbaren Strategien zurück."""
    return load_data(STRATEGIES_FILE)


def add_strategy(strategy_name):
    """Fügt eine neue Strategie hinzu, wenn sie noch nicht existiert."""
    strategies = load_data(STRATEGIES_FILE)

    # Überprüfe, ob die Strategie bereits existiert
    strategy_names = [s['name'].lower() for s in strategies]
    if strategy_name.lower() in strategy_names:
        return next((s for s in strategies if s['name'].lower() == strategy_name.lower()), None)

    # Erstelle neue Strategie
    new_id = 1
    if strategies:
        new_id = max(s['id'] for s in strategies) + 1

    new_strategy = {
        'id': new_id,
        'name': strategy_name
    }

    strategies.append(new_strategy)
    save_data(STRATEGIES_FILE, strategies)

    return new_strategy


# Checklistenvorlagen-Funktionen
def get_checklist_templates(journal_id):
    """Gibt alle Checklistenvorlagen für ein Journal zurück."""
    templates = load_data(TEMPLATES_FILE)
    return [t for t in templates if t['journal_id'] == journal_id]


def add_checklist_template(journal_id, data):
    """Fügt eine neue Checklistenvorlage hinzu."""
    templates = load_data(TEMPLATES_FILE)

    # Bestimme die höchste aktuelle Reihenfolge
    journal_templates = [t for t in templates if t['journal_id'] == journal_id]
    max_order = max([t['order'] for t in journal_templates], default=-1) + 1

    new_id = 1
    if templates:
        new_id = max(t['id'] for t in templates) + 1

    new_template = {
        'id': new_id,
        'journal_id': journal_id,
        'text': data['text'],
        'order': max_order
    }

    templates.append(new_template)
    save_data(TEMPLATES_FILE, templates)

    return new_template


def update_checklist_template(template_id, data):
    """Aktualisiert eine Checklistenvorlage."""
    templates = load_data(TEMPLATES_FILE)
    for template in templates:
        if template['id'] == template_id:
            if 'text' in data:
                template['text'] = data['text']

            save_data(TEMPLATES_FILE, templates)
            return template

    return None


def delete_checklist_template(template_id):
    """Löscht eine Checklistenvorlage."""
    templates = load_data(TEMPLATES_FILE)
    templates = [t for t in templates if t['id'] != template_id]
    save_data(TEMPLATES_FILE, templates)

    # Lösche zugehörige Checklistenstatus
    statuses = load_data(STATUSES_FILE)
    statuses = [s for s in statuses if s['template_id'] != template_id]
    save_data(STATUSES_FILE, statuses)

    return True


# Eintrags-Funktionen
def get_entries(journal_id):
    """Gibt alle Einträge für ein Journal zurück."""
    entries = load_data(ENTRIES_FILE)
    return [e for e in entries if e['journal_id'] == journal_id]


def get_entry(entry_id):
    """Gibt einen bestimmten Eintrag mit Details zurück."""
    entries = load_data(ENTRIES_FILE)
    entry = next((e for e in entries if e['id'] == entry_id), None)

    if entry:
        # Füge Checklistenstatus hinzu
        statuses = load_data(STATUSES_FILE)
        entry_statuses = [s for s in statuses if s['entry_id'] == entry_id]

        # Hole Vorlagentext für jeden Status
        templates = load_data(TEMPLATES_FILE)
        template_map = {t['id']: t for t in templates}

        checklist_statuses = []
        for status in entry_statuses:
            template = template_map.get(status['template_id'])
            if template:
                checklist_statuses.append({
                    'template_id': status['template_id'],
                    'text': template['text'],
                    'checked': status['checked'],
                    'order': template['order']
                })

        entry['checklist_statuses'] = sorted(checklist_statuses, key=lambda x: x['order'])

        # Füge Bilder hinzu
        images = load_data(IMAGES_FILE)
        entry_images = [i for i in images if i['entry_id'] == entry_id]

        for img in entry_images:
            img['file_path'] = f"/api/uploads/{img['file_path']}"

        entry['images'] = entry_images

    return entry


def create_entry(journal_id, data):
    """Erstellt einen neuen Eintrag."""
    entries = load_data(ENTRIES_FILE)

    # Generiere eine eindeutige ID
    new_id = 1
    if entries:
        new_id = max(e['id'] for e in entries) + 1

    # Verwende das angegebene Datum oder das aktuelle Datum
    entry_date = data.get('entry_date', datetime.datetime.utcnow().isoformat())

    # Füge Strategie hinzu, wenn angegeben
    strategy = data.get('strategy')
    if strategy:
        add_strategy(strategy)  # Speichert die Strategie in der Liste

    new_entry = {
        'id': new_id,
        'journal_id': journal_id,
        'entry_date': entry_date,
        'symbol': data.get('symbol'),
        'position_type': data.get('position_type'),
        'strategy': strategy,
        'initial_rr': data.get('initial_rr'),
        'pnl': data.get('pnl'),
        'result': data.get('result'),
        'confidence_level': data.get('confidence_level'),
        'trade_rating': data.get('trade_rating'),
        'notes': data.get('notes'),
        'stop_loss': data.get('stop_loss'),
        'take_profit': data.get('take_profit'),
        'custom_field_value': data.get('custom_field_value')  # Neues benutzerdefiniertes Feldwert
    }

    entries.append(new_entry)
    save_data(ENTRIES_FILE, entries)

    # Erstelle Checklistenstatus
    journal = get_journal(journal_id)
    if journal:
        templates = journal.get('checklist_templates', [])

        statuses = load_data(STATUSES_FILE)
        initial_statuses = data.get('checklist_statuses', {})

        for template in templates:
            template_id = template['id']
            status = {
                'entry_id': new_id,
                'template_id': template_id,
                'checked': initial_statuses.get(str(template_id), False)
            }
            statuses.append(status)

        save_data(STATUSES_FILE, statuses)

    # Gib den vollständigen Eintrag zurück
    return get_entry(new_id)


def update_entry(entry_id, data):
    """Aktualisiert einen bestehenden Eintrag."""
    entries = load_data(ENTRIES_FILE)
    for entry in entries:
        if entry['id'] == entry_id:
            # Aktualisiere die Felder
            fields = ['symbol', 'position_type', 'strategy', 'initial_rr', 'pnl', 'result',
                      'confidence_level', 'trade_rating', 'notes', 'stop_loss', 'take_profit',
                      'custom_field_value']  # Aktualisiert für das benutzerdefinierte Feld

            for field in fields:
                if field in data:
                    # Für Strategie, füge sie der Liste hinzu, wenn sie neu ist
                    if field == 'strategy' and data[field]:
                        add_strategy(data[field])

                    entry[field] = data[field]

            save_data(ENTRIES_FILE, entries)

            # Aktualisiere Checklistenstatus
            if 'checklist_statuses' in data and isinstance(data['checklist_statuses'], dict):
                statuses = load_data(STATUSES_FILE)
                for template_id_str, checked_status in data['checklist_statuses'].items():
                    try:
                        template_id = int(template_id_str)
                        for status in statuses:
                            if status['entry_id'] == entry_id and status['template_id'] == template_id:
                                status['checked'] = checked_status
                                break
                    except ValueError:
                        continue

                save_data(STATUSES_FILE, statuses)

            return get_entry(entry_id)

    return None


def delete_entry(entry_id):
    """Löscht einen Eintrag und zugehörige Daten."""
    entries = load_data(ENTRIES_FILE)
    entries = [e for e in entries if e['id'] != entry_id]
    save_data(ENTRIES_FILE, entries)

    delete_related_entry_data([entry_id])

    return True


def delete_related_entry_data(entry_ids):
    """Löscht alle mit den Einträgen verbundenen Daten."""
    if not entry_ids:
        return

    # Lösche Checklistenstatus
    statuses = load_data(STATUSES_FILE)
    statuses = [s for s in statuses if s['entry_id'] not in entry_ids]
    save_data(STATUSES_FILE, statuses)

    # Lösche Bilder und Dateien
    images = load_data(IMAGES_FILE)
    to_delete = [i for i in images if i['entry_id'] in entry_ids]

    for img in to_delete:
        file_path = os.path.join(UPLOADS_DIR, img['file_path'])
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError as e:
            print(f"Fehler beim Löschen der Bilddatei {img['file_path']}: {e}")

    images = [i for i in images if i['entry_id'] not in entry_ids]
    save_data(IMAGES_FILE, images)


# Checklistenstatus-Funktionen
def update_checklist_status(entry_id, template_id, checked):
    """Aktualisiert den Status eines Checklistenelements."""
    statuses = load_data(STATUSES_FILE)
    for status in statuses:
        if status['entry_id'] == entry_id and status['template_id'] == template_id:
            status['checked'] = checked
            save_data(STATUSES_FILE, statuses)
            return status

    return None


# Bild-Funktionen
def upload_image(entry_id, file, category="Before"):  # Standardwert geändert zu "Before"
    """Lädt ein Bild hoch und speichert die Metadaten."""
    if not file:
        return None

    # Akzeptiere nur "Before" und "After" als Kategorien
    if category not in ["Before", "After"]:
        category = "Before"  # Standardwert, wenn ungültige Kategorie

    # Erstelle einen eindeutigen Dateinamen
    original_filename = os.path.basename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)

    try:
        # Stelle sicher, dass das Upload-Verzeichnis existiert
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # Speichere die Datei
        file.save(file_path)

        # Erstelle einen Bildeintrag
        images = load_data(IMAGES_FILE)

        new_id = 1
        if images:
            new_id = max(i['id'] for i in images) + 1

        current_time = datetime.datetime.utcnow().isoformat()

        new_image = {
            'id': new_id,
            'entry_id': entry_id,
            'file_path': unique_filename,
            'category': category,
            'uploaded_at': current_time
        }

        images.append(new_image)
        save_data(IMAGES_FILE, images)

        # Formatiere für die Antwort
        return {
            'id': new_image['id'],
            'file_path': f"/api/uploads/{new_image['file_path']}",
            'category': new_image['category'],
            'uploaded_at': new_image['uploaded_at']
        }

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        print(f"Fehler beim Hochladen des Bildes: {e}")
        return None


def delete_image(image_id):
    """Löscht ein Bild und seine Datei."""
    images = load_data(IMAGES_FILE)
    image = next((i for i in images if i['id'] == image_id), None)

    if image:
        file_path = os.path.join(UPLOADS_DIR, image['file_path'])
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError as e:
            print(f"Fehler beim Löschen der Bilddatei {image['file_path']}: {e}")

        images = [i for i in images if i['id'] != image_id]
        save_data(IMAGES_FILE, images)
        return True

    return False


# Statistik-Funktionen
def get_journal_statistics(journal_id):
    """Berechnet und gibt Statistiken für ein Journal zurück."""
    entries = get_entries(journal_id)

    if not entries:
        return None

    # Grundlegende Statistiken
    total_trades = len(entries)
    wins = sum(1 for e in entries if e.get('result') == "Win")
    losses = sum(1 for e in entries if e.get('result') == "Loss")
    bes = sum(1 for e in entries if e.get('result') == "BE")
    partial_bes = sum(1 for e in entries if e.get('result') == "PartialBE")

    win_rate = (wins / total_trades * 100) if total_trades > 0 else 0

    long_positions = sum(1 for e in entries if e.get('position_type') == "Long")
    short_positions = sum(1 for e in entries if e.get('position_type') == "Short")

    # PnL-Berechnungen
    pnl_values = [e.get('pnl') for e in entries if e.get('pnl') is not None]
    total_pnl = sum(pnl_values)
    avg_pnl = total_pnl / total_trades if total_trades > 0 else 0

    winning_pnls = [e.get('pnl') for e in entries if e.get('result') == "Win" and e.get('pnl') is not None]
    losing_pnls = [e.get('pnl') for e in entries if e.get('result') == "Loss" and e.get('pnl') is not None]

    avg_win_pnl = sum(winning_pnls) / len(winning_pnls) if winning_pnls else 0
    avg_loss_pnl = sum(losing_pnls) / len(losing_pnls) if losing_pnls else 0

    # R/R-Werte
    rr_values = [e.get('initial_rr') for e in entries if e.get('initial_rr') is not None]
    avg_rr = sum(rr_values) / len(rr_values) if rr_values else 0

    # Checklistennutzung
    checklist_usage = calculate_checklist_usage(journal_id, entries)

    # Symbol-Performance
    symbol_stats = calculate_symbol_performance(entries)

    # Strategie-Performance
    strategy_stats = calculate_strategy_performance(entries)

    journal = get_journal(journal_id)

    return {
        'journal_name': journal['name'] if journal else "",
        'total_trades': total_trades,
        'win_rate_percentage': round(win_rate, 2),
        'results_count': {
            'Win': wins,
            'Loss': losses,
            'BE': bes,
            'PartialBE': partial_bes
        },
        'position_type_count': {
            'Long': long_positions,
            'Short': short_positions
        },
        'average_pnl': round(avg_pnl, 2),
        'average_winning_pnl': round(avg_win_pnl, 2),
        'average_losing_pnl': round(avg_loss_pnl, 2),
        'average_initial_rr': round(avg_rr, 1) if avg_rr is not None else None,
        'checklist_usage': checklist_usage,
        'symbol_performance': symbol_stats,
        'strategy_performance': strategy_stats  # Neue Strategie-Statistiken
    }


def calculate_checklist_usage(journal_id, entries):
    """Berechnet die Nutzung von Checklistenelementen."""
    templates = get_checklist_templates(journal_id)
    statuses = load_data(STATUSES_FILE)

    results = []
    for template in templates:
        template_id = template['id']

        # Finde alle Status für diese Vorlage
        template_statuses = [s for s in statuses if s['template_id'] == template_id]
        total = len(template_statuses)

        if total > 0:
            checked_count = sum(1 for s in template_statuses if s['checked'])
            percentage = (checked_count / total * 100)

            results.append({
                'text': template['text'],
                'checked_percentage': percentage,
                'checked_count': checked_count,
                'total_entries_with_item': total
            })

    return results


def calculate_symbol_performance(entries):
    """Berechnet die Performance nach Symbol."""
    symbol_data = {}

    for entry in entries:
        symbol = entry.get('symbol')
        if not symbol:
            continue

        if symbol not in symbol_data:
            symbol_data[symbol] = {'count': 0, 'wins': 0, 'losses': 0}

        symbol_data[symbol]['count'] += 1

        if entry.get('result') == "Win":
            symbol_data[symbol]['wins'] += 1
        elif entry.get('result') == "Loss":
            symbol_data[symbol]['losses'] += 1

    results = []
    for symbol, data in symbol_data.items():
        win_rate = (data['wins'] / data['count'] * 100) if data['count'] > 0 else 0

        results.append({
            'symbol': symbol,
            'count': data['count'],
            'wins': data['wins'],
            'losses': data['losses'],
            'win_rate': win_rate
        })

    # Sortiere nach Anzahl der Einträge (absteigend)
    results.sort(key=lambda x: x['count'], reverse=True)

    return results


def calculate_strategy_performance(entries):
    """Berechnet die Performance nach Strategie."""
    strategy_data = {}

    for entry in entries:
        strategy = entry.get('strategy')
        if not strategy:
            continue

        if strategy not in strategy_data:
            strategy_data[strategy] = {'count': 0, 'wins': 0, 'losses': 0, 'pnl': 0}

        strategy_data[strategy]['count'] += 1

        if entry.get('result') == "Win":
            strategy_data[strategy]['wins'] += 1
        elif entry.get('result') == "Loss":
            strategy_data[strategy]['losses'] += 1

        # Füge PnL hinzu, wenn vorhanden
        if entry.get('pnl') is not None:
            strategy_data[strategy]['pnl'] += entry.get('pnl')

    results = []
    for strategy, data in strategy_data.items():
        win_rate = (data['wins'] / data['count'] * 100) if data['count'] > 0 else 0
        avg_pnl = data['pnl'] / data['count'] if data['count'] > 0 else 0

        results.append({
            'strategy': strategy,
            'count': data['count'],
            'wins': data['wins'],
            'losses': data['losses'],
            'win_rate': win_rate,
            'total_pnl': data['pnl'],
            'avg_pnl': avg_pnl
        })

    # Sortiere nach Anzahl der Einträge (absteigend)
    results.sort(key=lambda x: x['count'], reverse=True)

    return results

# This goes in src/data_storage.py
# Function to delete a journal and all its related data

def delete_journal(journal_id):
    """Löscht ein Journal und alle zugehörigen Daten."""
    journals = load_data(JOURNALS_FILE)
    journals = [j for j in journals if j['id'] != journal_id]
    save_data(JOURNALS_FILE, journals)

    # Lösche zugehörige Vorlagen
    templates = load_data(TEMPLATES_FILE)
    templates = [t for t in templates if t['journal_id'] != journal_id]
    save_data(TEMPLATES_FILE, templates)

    # Finde Einträge, die zum Journal gehören
    entries = load_data(ENTRIES_FILE)
    entry_ids = [e['id'] for e in entries if e['journal_id'] == journal_id]
    entries = [e for e in entries if e['journal_id'] != journal_id]
    save_data(ENTRIES_FILE, entries)

    # Lösche Checklistenstatus und Bilder für die Einträge
    delete_related_entry_data(entry_ids)

    return True

def delete_entry(entry_id):
    """Löscht einen Eintrag und zugehörige Daten."""
    entries = load_data(ENTRIES_FILE)
    entries = [e for e in entries if e['id'] != entry_id]
    save_data(ENTRIES_FILE, entries)

    delete_related_entry_data([entry_id])

    return True

def delete_related_entry_data(entry_ids):
    """Löscht alle mit den Einträgen verbundenen Daten."""
    if not entry_ids:
        return

    # Lösche Checklistenstatus
    statuses = load_data(STATUSES_FILE)
    statuses = [s for s in statuses if s['entry_id'] not in entry_ids]
    save_data(STATUSES_FILE, statuses)

    # Lösche Bilder und Dateien
    images = load_data(IMAGES_FILE)
    to_delete = [i for i in images if i['entry_id'] in entry_ids]

    for img in to_delete:
        file_path = os.path.join(UPLOADS_DIR, img['file_path'])
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError as e:
            print(f"Fehler beim Löschen der Bilddatei {img['file_path']}: {e}")

    images = [i for i in images if i['entry_id'] not in entry_ids]
    save_data(IMAGES_FILE, images)

# Initialisierung
init_data_files()