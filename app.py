"""
Flask backend pour le dashboard irrigation AIMKEY.
Lit le fichier irrigation_data.csv ecrit par le notebook Jupyter (predict_live.py)
et expose les donnees via API REST sur le port 5000.

Usage:
  python app.py
"""

from flask import Flask, jsonify
from flask_cors import CORS
import csv
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Tous les emplacements possibles du CSV
CSV_SEARCH_PATHS = [
    os.path.join(os.path.expanduser("~"), "irrigation_data.csv"),           # C:\Users\dellp\irrigation_data.csv (notebook)
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "irrigation_data.csv"),  # public/
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "irrigation_data.csv"),            # racine projet
]


def find_csv():
    """Trouve le fichier CSV le plus recent"""
    best = None
    best_mtime = 0
    for path in CSV_SEARCH_PATHS:
        if os.path.exists(path):
            mtime = os.path.getmtime(path)
            if mtime > best_mtime:
                best = path
                best_mtime = mtime
    return best


def read_csv_rows():
    """Lit toutes les lignes du CSV"""
    csv_path = find_csv()
    if not csv_path:
        return []
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)
    except Exception as e:
        print(f"Erreur lecture CSV: {e}")
        return []


def parse_row_to_sensor_data(row):
    """Convertit une ligne CSV en donnees capteur pour le frontend"""
    try:
        humidite = float(row.get("Humidite_%", 0))
        temperature = float(row.get("Temperature_C", 0))
        luminosite = float(row.get("Luminosite_%", 0))
        score = int(float(row.get("Score", 0)))
        etat = row.get("Etat", "INCONNU")
        led_verte = row.get("LED_VERTE", "OFF")
        led_rouge = row.get("LED_ROUGE", "OFF")
        heure = row.get("Heure", "--:--:--")
        date = row.get("Date", "--")

        # Prediction AI basee sur le score
        if score >= 70:
            ai_prediction = "IRRIGATION"
            ai_confiance = min(99, 60 + score - 70)
        else:
            ai_prediction = "PAS IRRIGATION"
            ai_confiance = min(99, max(50, 100 - score))

        # Seuil irrigation dynamique
        seuil_irrigation = round(max(30, min(50, 40 + (temperature - 25) * 0.5)), 1)

        # Prediction temporelle
        heure_prevue = None
        temps_restant_min = None
        tendance_par_min = None

        if ai_prediction == "IRRIGATION":
            temps_restant_min = 0
        elif humidite < seuil_irrigation + 15:
            diff = humidite - seuil_irrigation
            if diff > 0:
                tendance_par_min = -0.5
                temps_restant_min = round(diff / 0.5, 1)
                heure_prevue_dt = datetime.now() + timedelta(minutes=temps_restant_min)
                heure_prevue = heure_prevue_dt.strftime("%H:%M:%S")
            else:
                tendance_par_min = -0.5
                temps_restant_min = 0
                heure_prevue = None

        return {
            "humidite": humidite,
            "temperature": temperature,
            "luminosite": luminosite,
            "score": score,
            "etat": etat,
            "led_verte": led_verte,
            "led_rouge": led_rouge,
            "heure": heure,
            "date": date,
            "ai_prediction": ai_prediction,
            "ai_confiance": ai_confiance,
            "seuil_irrigation": seuil_irrigation,
            "heure_prevue": heure_prevue,
            "temps_restant_min": temps_restant_min,
            "tendance_par_min": tendance_par_min,
        }
    except Exception as e:
        print(f"Erreur parsing row: {e}")
        return None


@app.route("/api/data", methods=["GET"])
def get_data():
    """Retourne les dernieres donnees capteur + prediction AI"""
    rows = read_csv_rows()
    if not rows:
        return jsonify({"error": "Aucune donnee capteur. Verifiez que le notebook Jupyter tourne."}), 404

    last_row = rows[-1]
    data = parse_row_to_sensor_data(last_row)
    if not data:
        return jsonify({"error": "Erreur de parsing des donnees"}), 500

    return jsonify(data)


@app.route("/api/history", methods=["GET"])
def get_history():
    """Retourne l'historique des 60 dernieres mesures"""
    rows = read_csv_rows()
    if not rows:
        return jsonify({"error": "Aucun historique disponible"}), 404

    recent = rows[-60:]

    heures = []
    humidites = []
    temperatures = []
    luminosites = []
    scores = []

    for row in recent:
        try:
            heures.append(row.get("Heure", ""))
            humidites.append(float(row.get("Humidite_%", 0)))
            temperatures.append(float(row.get("Temperature_C", 0)))
            luminosites.append(float(row.get("Luminosite_%", 0)))
            scores.append(int(float(row.get("Score", 0))))
        except (ValueError, TypeError):
            continue

    return jsonify({
        "heures": heures,
        "humidites": humidites,
        "temperatures": temperatures,
        "luminosites": luminosites,
        "scores": scores,
    })


@app.route("/api/status", methods=["GET"])
def get_status():
    """Health check"""
    csv_path = find_csv()
    return jsonify({
        "status": "ok",
        "csv_found": csv_path is not None,
        "csv_path": csv_path,
        "timestamp": datetime.now().isoformat(),
    })


if __name__ == "__main__":
    csv_path = find_csv()
    print("=" * 50)
    print("  AIMKEY Irrigation Flask Backend")
    print("=" * 50)
    if csv_path:
        print(f"  CSV: {csv_path}")
    else:
        print("  CSV non trouve!")
    print(f"  API: http://localhost:5000/api/data")
    print(f"  API: http://localhost:5000/api/history")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
