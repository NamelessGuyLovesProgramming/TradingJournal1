#!/usr/bin/env python3
# restore_images.py - Wiederherstellungstool für images.json

import os
import sys
import json
import shutil
import datetime
from pathlib import Path

# Verzeichnispfade
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'backend', 'data')
BACKUP_DIR = os.path.join(DATA_DIR, 'backups')
IMAGES_FILE = os.path.join(DATA_DIR, 'images.json')


def print_colored(text, color="white"):
    """Text mit Farbe ausgeben"""
    colors = {
        'red': '\033[91m',
        'green': '\033[92m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'magenta': '\033[95m',
        'cyan': '\033[96m',
        'white': '\033[97m',
        'reset': '\033[0m'
    }

    print(f"{colors.get(color, colors['white'])}{text}{colors['reset']}")


def validate_json_file(file_path):
    """Überprüft, ob eine Datei gültiges JSON enthält"""
    try:
        if not os.path.exists(file_path):
            return False, "Datei existiert nicht"

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()

        if not content or content == '[]':
            return False, "Datei ist leer"

        data = json.loads(content)

        if not isinstance(data, list):
            return False, "JSON-Inhalt ist keine Liste"

        return True, f"Gültiges JSON mit {len(data)} Einträgen"
    except json.JSONDecodeError as e:
        return False, f"Ungültiges JSON: {e}"
    except Exception as e:
        return False, f"Fehler: {e}"


def create_backup_dir_if_needed():
    """Erstellt das Backup-Verzeichnis falls es nicht existiert"""
    if not os.path.exists(BACKUP_DIR):
        try:
            os.makedirs(BACKUP_DIR)
            print_colored(f"Backup-Verzeichnis erstellt: {BACKUP_DIR}", "green")
            return True
        except Exception as e:
            print_colored(f"Fehler beim Erstellen des Backup-Verzeichnisses: {e}", "red")
            return False
    return True


def backup_current_file():
    """Erstellt ein Backup der aktuellen images.json falls vorhanden"""
    if not os.path.exists(IMAGES_FILE):
        print_colored("Keine aktuelle images.json zum Sichern vorhanden", "yellow")
        return True

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"current_images_{timestamp}.json.bak"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)

    try:
        shutil.copy2(IMAGES_FILE, backup_path)
        print_colored(f"Aktuelle images.json gesichert als: {backup_filename}", "green")
        return True
    except Exception as e:
        print_colored(f"Fehler beim Sichern der aktuellen Datei: {e}", "red")
        return False


def list_available_backups():
    """Listet alle verfügbaren Backups auf"""
    if not os.path.exists(BACKUP_DIR):
        print_colored("Kein Backup-Verzeichnis gefunden!", "red")
        return []

    backup_files = [f for f in os.listdir(BACKUP_DIR) if f.startswith('images.json_') and f.endswith('.bak')]

    if not backup_files:
        print_colored("Keine Backup-Dateien gefunden!", "yellow")
        return []

    # Nach Erstellungsdatum sortieren (neueste zuerst)
    backup_files.sort(reverse=True)

    print_colored(f"Gefundene Backups: {len(backup_files)}", "cyan")
    print_colored("Verfügbare Backups:", "cyan")

    for idx, backup_file in enumerate(backup_files):
        backup_path = os.path.join(BACKUP_DIR, backup_file)
        is_valid, message = validate_json_file(backup_path)

        # Versuche das Datum aus dem Dateinamen zu extrahieren
        date_str = backup_file.replace('images.json_', '').replace('.bak', '')
        try:
            date_time = datetime.datetime.strptime(date_str, "%Y%m%d_%H%M%S")
            date_formatted = date_time.strftime("%d.%m.%Y %H:%M:%S")
        except:
            date_formatted = "Unbekanntes Datum"

        status_color = "green" if is_valid else "red"
        status_text = "✓ Gültig" if is_valid else "✗ Ungültig"

        print(f"  [{idx + 1}] {backup_file} ({date_formatted}) - {status_text}")

    return backup_files


def restore_from_backup(backup_idx=None):
    """Stellt images.json aus dem ausgewählten Backup wieder her"""
    backup_files = list_available_backups()

    if not backup_files:
        return False

    selected_idx = backup_idx
    if selected_idx is None:
        try:
            selected_idx = int(
                input("\nWähle ein Backup zur Wiederherstellung [1-{}] (0 = abbrechen): ".format(len(backup_files))))
            if selected_idx == 0:
                print_colored("Wiederherstellung abgebrochen.", "yellow")
                return False

            if selected_idx < 1 or selected_idx > len(backup_files):
                print_colored("Ungültige Auswahl!", "red")
                return False

        except ValueError:
            print_colored("Bitte gib eine Zahl ein!", "red")
            return False

    selected_backup = backup_files[selected_idx - 1]
    backup_path = os.path.join(BACKUP_DIR, selected_backup)

    is_valid, message = validate_json_file(backup_path)
    if not is_valid:
        print_colored(f"Das ausgewählte Backup ist ungültig: {message}", "red")
        return False

    # Sichere die aktuelle Datei wenn sie existiert
    backup_current_file()

    try:
        # Stelle sicher, dass das Zielverzeichnis existiert
        os.makedirs(os.path.dirname(IMAGES_FILE), exist_ok=True)

        # Kopiere die Backup-Datei
        shutil.copy2(backup_path, IMAGES_FILE)
        print_colored(f"✓ Wiederherstellung aus {selected_backup} erfolgreich!", "green")

        # Überprüfe die wiederhergestellte Datei
        is_valid, message = validate_json_file(IMAGES_FILE)
        if is_valid:
            print_colored(f"✓ Wiederhergestellte Datei validiert: {message}", "green")
        else:
            print_colored(f"⚠ Warnung: Die wiederhergestellte Datei scheint Probleme zu haben: {message}", "yellow")

        return True
    except Exception as e:
        print_colored(f"Fehler bei der Wiederherstellung: {e}", "red")
        return False


def main():
    """Hauptfunktion"""
    print_colored("\n===== Images.json Wiederherstellungs-Tool =====", "cyan")
    print_colored("Dieses Tool hilft dir, die images.json-Datei aus einem Backup wiederherzustellen.\n", "white")

    # Prüfe aktuelle images.json
    print_colored("Überprüfe aktuelle images.json...", "blue")
    is_valid, message = validate_json_file(IMAGES_FILE)

    if is_valid:
        print_colored(f"✓ Aktuelle images.json ist gültig: {message}", "green")
        proceed = input("Die aktuelle Datei ist gültig. Trotzdem fortfahren? (j/n): ").lower() == 'j'
        if not proceed:
            print_colored("Vorgang abgebrochen.", "yellow")
            return
    else:
        print_colored(f"✗ Problem mit der aktuellen images.json: {message}", "red")

    # Erstelle Backup-Verzeichnis falls nötig
    if not create_backup_dir_if_needed():
        return

    # Rufe die Wiederherstellungsfunktion auf
    restore_from_backup()

    print_colored("\nVorgang abgeschlossen.", "cyan")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pri