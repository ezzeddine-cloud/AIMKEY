<div align="center">
  <img src="public/logo.png" alt="Gabes bin ydik Logo" width="120" />
  <h1>🌴 Gabes bin ydik (ڤَابس بين يديك)</h1>
  <p><strong>Smart Agriculture & IoT Solutions for the Gabès Oasis</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

---

<div align="center">
  <img src="public/smart_oasis_farm.png" alt="Smart Oasis Farm Banner" width="100%" />
</div>

## 🌟 Overview

**Gabes bin ydik** is a state-of-the-art platform designed to preserve and modernize the agricultural heritage of the Tunisian oasis of Gabès. By bridging the gap between **Internet of Things (IoT)** and **Artificial Intelligence (AI)**, we empower local farmers to combat climate change through data-driven precision farming.

---

## 🚀 Core Features

### 1. 💧 Intelligent Irrigation & AI Forecasting
*   **Precision Monitoring:** Live telemetry from soil moisture, temperature, and light sensors.
*   **Predictive AI:** Proprietary models analyze environmental trends to forecast irrigation needs, optimizing every drop of water.
*   **Dual Control:** Seamless switching between autonomous AI-managed irrigation and manual overrides via the dashboard.

### 2. 🌬️ Air Quality & Environmental Stewardship
*   **Pollution Heatmaps:** Geospatial visualization of PM2.5 levels across Gabès using Leaflet.
*   **Public Safety Alerts:** Instant notifications for farmers and citizens when air quality reaches hazardous levels.

### 3. 🤖 اسألني (Ask Me) - AI Agricultural Assistant
*   **Localized Intelligence:** A specialized chatbot fluent in **Tunisian Arabic (Derja)**, tailored for the specific needs of oasis farmers.
*   **Sustainable Expertise:** Expert guidance on pest management, crop rotation, and traditional oasis farming techniques.

### 4. 📊 Enterprise Management Dashboard
*   **Farmer Portal:** Personalized insights, irrigation logs, and crop health status.
*   **Administrative Suite:** Centralized management for IoT installation requests, automated professional communication (SMTP), and regional agricultural analytics.

---

## 🎮 Interactive 3D Visualization

Experience the future of oasis farming with our **FallahTech 3D Simulation**. This immersive visualization demonstrates the real-time interaction between IoT sensors, AI decision-making, and automated irrigation systems in a virtual Gabès field.

> [!TIP]
> **View the Demo:** You can explore the 3D visualization by opening [public/fallahtech_3d.html](public/fallahtech_3d.html) in your browser.

---

## 📊 Datasets & External Resources

The platform leverages the following publicly available datasets and hardware documentation to power its AI models and IoT systems:

### 🌫️ Air Quality Dataset
- **Source**: [Kaggle – Air Quality Data Set](https://www.kaggle.com/datasets/fedesoriano/air-quality-data-set)
- **Usage**: Used to train and validate the pollution heatmap models, correlating PM2.5 readings with environmental variables across time.

### 🌤️ Weather Data
- **Source**: [Kaggle – Weather Data](https://www.kaggle.com/datasets/bhanupratapbiswas/weather-data)
- **Usage**: Provides historical weather patterns (temperature, humidity, precipitation) to improve the accuracy of AI irrigation predictions and crop health recommendations.

### 🔌 Microcontroller Documentation – PIC16F77A
- **Source**: [Microchip Technology – PIC16F77A Datasheet (PDF)](https://ww1.microchip.com/downloads/en/devicedoc/39582c.pdf)
- **Usage**: Reference documentation for the PIC16F77A microcontroller used in the IoT sensor nodes. Covers ADC configuration, I/O port setup, and communication protocols (SPI/I2C) relevant to our soil moisture and temperature sensor integration.

---

## 🛠️ Technology Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| **Backend/Cloud** | Firebase (Firestore, Authentication, Hosting) |
| **AI/ML** | Google Gemini AI, Python (Scikit-learn/TensorFlow for live prediction) |
| **Mapping** | Leaflet.js with custom heatmap overlays |
| **Communication** | Nodemailer (SMTP) for official administrative alerts |

---

## 📦 Installation & Configuration

### Prerequisites
- Node.js 18+
- Firebase Project
- Google AI (Gemini) API Key

### Setup Steps
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ezzeddine-cloud/AIMKEY.git
    cd AIMKEY
    ```
2.  **Install Dependencies**
    ```bash
    npm install
    ```
3.  **Environment Variables**
    Copy `.env.example` to `.env.local` and populate your credentials:
    ```bash
    cp .env.example .env.local
    ```
4.  **Launch Development Server**
    - **Standard Dev:** `npm run dev` (Runs on `http://localhost:3030`)
    - **With Firebase Emulators:** `npm run dev:stack` (Runs both Next.js and Local Firebase Emulators)
    - **Clean Dev:** `npm run dev:clean` (Clears Next.js cache before starting)

---

## 🏆 Hackathon Project

Developed with passion for the **AIMKEY Hackathon**.  
**Gabes bin ydik** represents a vision where technology honors tradition, ensuring that the ancient oases of Gabès thrive in the digital age.

---

<div align="center">
  <p>© 2026 Smart City Gabes Team. Built with ❤️ for a greener tomorrow.</p>
</div>
