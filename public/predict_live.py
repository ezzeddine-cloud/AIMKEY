"""
Script de lecture capteur IoT en temps réel via COM4 (Proteus).
Écrit les données directement dans le dossier public/ de l'app Next.js
pour affichage en temps réel dans le navigateur.

Usage :
  cd C:\\Users\\dellp\\Downloads\\projethackaton\\AIMKEY\\public
  python predict_live.py
"""

import serial
import sys
import time
import csv
import os
import numpy as np
from datetime import datetime, timedelta
from collections import deque
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier

PORT = 'COM4'
BAUD = 9600

# ── Le CSV est écrit DANS le dossier public/ de Next.js ──
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(SCRIPT_DIR, 'irrigation_data.csv')

# Seuils irrigation
SEUIL_HUMIDITE = 400
SEUIL_TEMP     = 600
SEUIL_LUMIERE  = 500

# Historique pour la prédiction temporelle
historique_humidite = deque(maxlen=60)
historique_temps    = deque(maxlen=60)

# ==========================================
# CHARGEMENT DU MODÈLE AI
# ==========================================
def entrainer_modele():
    """Entraîne le modèle AI sur des données synthétiques"""
    np.random.seed(42)
    n = 5000

    humidite    = np.random.uniform(5, 100, n)
    temperature = np.random.uniform(10, 50, n)
    luminosite  = np.random.uniform(0, 100, n)

    seuil = 40 + (temperature - 25) * 0.5
    bruit = np.random.normal(0, 5, n)
    irrigation = ((humidite + bruit) < seuil).astype(int)

    X = np.column_stack([humidite, temperature, luminosite])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = GradientBoostingClassifier(n_estimators=200, max_depth=5, random_state=42)
    model.fit(X_scaled, irrigation)

    print("🤖 Modèle AI entraîné avec succès!", flush=True)
    return model, scaler

# Entraîner le modèle au démarrage
model_ai, scaler_ai = entrainer_modele()


def prediction_ai(hum_pct, temp_c, lum_pct):
    """Utilise le modèle AI pour prédire si l'arbre a besoin d'eau"""
    X_new    = np.array([[hum_pct, temp_c, lum_pct]])
    X_scaled = scaler_ai.transform(X_new)
    prediction = model_ai.predict(X_scaled)[0]
    proba      = model_ai.predict_proba(X_scaled)[0]
    return prediction, proba


def trouver_seuil_ai(temp_c, lum_pct):
    """Trouve le seuil d'humidité où le modèle bascule vers IRRIGATION"""
    for h in range(100, 0, -1):
        pred, _ = prediction_ai(h, temp_c, lum_pct)
        if pred == 1:
            return h
    return 40


def predire_heure_irrigation(hum_pct, temp_c, lum_pct):
    now = datetime.now()
    historique_humidite.append(hum_pct)
    historique_temps.append(time.time())

    pred_ai, proba = prediction_ai(hum_pct, temp_c, lum_pct)
    proba_irrigation = proba[1] * 100

    if pred_ai == 1:
        return "IRRIGATION", f"IRRIGATION NÉCESSAIRE (confiance: {proba_irrigation:.0f}%)"

    seuil = trouver_seuil_ai(temp_c, lum_pct)

    if len(historique_humidite) < 5:
        return "PAS IRRIGATION", f"Collecte tendance ({len(historique_humidite)}/5)..."

    temps     = np.array(historique_temps)
    humidites = np.array(historique_humidite)
    t_rel     = temps - temps[0]

    n     = len(t_rel)
    denom = n * np.sum(t_rel**2) - np.sum(t_rel)**2
    if denom == 0:
        return "PAS IRRIGATION", "Tendance incalculable"

    a = (n * np.sum(t_rel * humidites) - np.sum(t_rel) * np.sum(humidites)) / denom
    taux_min = a * 60

    if a >= 0:
        return "PAS IRRIGATION", "Humidité stable"

    if hum_pct <= seuil:
        return "IRRIGATION", f"Irrigation imminente ! (confiance: {proba_irrigation:.0f}%)"

    sec_restantes = (hum_pct - seuil) / abs(a)
    min_restantes = sec_restantes / 60
    heure_prevue  = now + timedelta(seconds=sec_restantes)

    if min_restantes < 1:
        temps_str = "< 1 min"
    elif min_restantes < 60:
        temps_str = f"{min_restantes:.1f} min"
    else:
        temps_str = f"{min_restantes / 60:.1f}h"

    return "PAS IRRIGATION", f"Besoin vers {heure_prevue.strftime('%H:%M:%S')} ({temps_str})"


# ──────────────────────────────────────────
# CSV
# ──────────────────────────────────────────
def init_csv():
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Date', 'Heure', 'Humidite_%', 'Temperature_C',
                'Luminosite_%', 'Score', 'Etat', 'LED_VERTE', 'LED_ROUGE',
                'Prediction', 'Etat_Reel'
            ])
        print(f"✅ Fichier CSV créé : {CSV_FILE}", flush=True)
    else:
        print(f"📂 Fichier CSV existant : {CSV_FILE}", flush=True)


def sauvegarder_csv(hum_pct, temp_c, lum_pct, score, etat, led_v, led_r, prediction, etat_reel):
    now   = datetime.now()
    date  = now.strftime("%Y-%m-%d")
    heure = now.strftime("%H:%M:%S")
    with open(CSV_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            date, heure, hum_pct, temp_c, lum_pct,
            score, etat, led_v, led_r, prediction, etat_reel
        ])
    print(f"💾 → {CSV_FILE}", flush=True)


def analyser_plante(hum, temp, lum):
    hum_pct = round(hum * 100.0 / 1023, 1)
    temp_c  = round(temp * 50.0 / 1023, 1)
    lum_pct = round(lum * 100.0 / 1023, 1)

    score = 0
    if hum_pct < 40:   score += 50
    elif hum_pct < 60: score += 25
    if temp_c > 30:    score += 30
    elif temp_c > 25:  score += 15
    if lum_pct > 70:   score += 20

    return hum_pct, temp_c, lum_pct, score


def afficher_statut(hum_pct, temp_c, lum_pct, score):
    now = datetime.now().strftime("%H:%M:%S")

    print(f"\n{'═'*50}")
    print(f"  🕐 {now}")
    print(f"{'═'*50}")
    print(f"  💧 Humidité sol  : {hum_pct:5.1f}%")
    print(f"  🌡️  Température   : {temp_c:5.1f}°C")
    print(f"  ☀️  Luminosité    : {lum_pct:5.1f}%")
    print(f"{'─'*50}")
    print(f"  📊 Score besoin eau : {score}/100")

    if score >= 70:
        etat  = "SOL TRES SEC - IRRIGATION ACTIVEE"
        led_v = "ON"
        led_r = "ON"
        print("  🔴 IRRIGATION ACTIVÉE")
    elif score >= 40:
        etat  = "SOL SEC - IRRIGATION BIENTOT"
        led_v = "OFF"
        led_r = "OFF"
        print("  🟡 SOL SEC")
    else:
        etat  = "SOL HUMIDE - PAS IRRIGATION"
        led_v = "OFF"
        led_r = "OFF"
        print("  🟢 SOL HUMIDE")

    # Prédiction AI
    print(f"{'─'*50}")
    prediction, detail = predire_heure_irrigation(hum_pct, temp_c, lum_pct)
    print(f"  🤖 AI : {prediction} — {detail}")

    # État réel basé sur le score
    etat_reel = "IRRIGATION" if score >= 70 else "PAS IRRIGATION"

    print(f"{'═'*50}", flush=True)

    sauvegarder_csv(hum_pct, temp_c, lum_pct, score, etat, led_v, led_r, prediction, etat_reel)


# ══════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════
init_csv()

try:
    ser = serial.Serial(
        port=PORT, baudrate=BAUD,
        bytesize=8, parity='N', stopbits=1, timeout=2
    )
    print(f"✅ Port {PORT} ouvert!")
    print(f"📁 CSV → {CSV_FILE}")
    print("🌱 Système irrigation temps réel démarré\n", flush=True)

    while True:
        line = ser.readline()
        if line:
            decoded = line.decode('utf-8', errors='ignore').strip()
            try:
                parts = decoded.split(',')
                hum  = int(parts[0].split(':')[1])
                temp = int(parts[1].split(':')[1])
                lum  = int(parts[2].split(':')[1])

                hum_pct, temp_c, lum_pct, score = analyser_plante(hum, temp, lum)
                afficher_statut(hum_pct, temp_c, lum_pct, score)

            except Exception as e:
                print(f"⚠️ Données brutes: {decoded}", flush=True)
        else:
            print("⏳ Attente données Proteus...", flush=True)

except serial.SerialException as e:
    print(f"❌ Erreur port série: {e}", flush=True)
except KeyboardInterrupt:
    print("\n⏹️ Système arrêté", flush=True)
    ser.close()
