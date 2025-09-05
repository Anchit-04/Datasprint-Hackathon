# 🌱 AI-Powered Potato Crop Growth Stage & Nutrient Health Management  

## 📌 Problem Statement  
Develop an AI solution that uses satellite imagery to simultaneously detect **growth stages of potato crops** and **map nutrient health** (e.g., Nitrogen levels).  

The system should deliver **precise, stage-specific irrigation and fertilizer recommendations** to:  
- Maximize yield  
- Optimize resource use  
- Reduce costs  
- Improve long-term soil health  

---

## 🚜 Why It Matters  
- Incorrect timing of irrigation or fertilization can drastically reduce yields.  
- Inefficient nutrient management increases costs and degrades soil quality.  
- An **integrated growth stage–nutrient health** approach ensures resources are applied at the **right time, in the right quantity, and to the right zones**.  

---
🚧 **Note:** We were only told to implement **30% of the project**.
- Nutrient health mapping and the complete recommendation system using gen-ai are planned but not yet implemented.  

## 📂 Data Sources & APIs  
- 🌍 **Sentinel-2 satellite imagery**  
- 🌱 **NDVI/NDRE vegetation indices**  
- 🧪 **Soil fertility datasets**  
- 🌦 **Historical yield and weather data** (optional for refinement)  

---

## 🎯 Prototype Goals  
- Process **sample satellite images** of potato fields  
- Classify fields into **at least 3 growth stages**  
- Highlight **low-fertility zones** using NDVI/NDRE analysis  

---

## 🏗️ System Architecture  

```mermaid
flowchart TD
  %% Farmer Input
  subgraph Farmer_Input [Farmer Input]
    A(Start) --> B[Farmer logs in & provides field data]
    B --> C[1. Field Location & Boundaries]
    B --> D[2. Uploads Soil Health Card]
  end

  %% Automated Backend Pipeline
  subgraph Backend_Pipeline [Automated Backend Pipeline]
    E[Weekly Scheduler]
    E --> F[Fetch Sentinel-2 Satellite Images]
    E --> G[Fetch Weather & Historical Data]
  end

  %% AI Analysis & Processing
  subgraph AI_Analysis [AI Analysis & Processing]
    H((AI Core))
    C --> H
    D --> H
    F --> H
    G --> H
    H --> I[Process Images:<br>Calculate NDVI/NDRE]
    I --> J([ML Model:<br>Classify Growth Stage])
    I --> K([ML Model:<br>Map Nutrient Health - N, P, K])
  end

  %% Recommendation Engine
  subgraph Recommendation_Engine [Recommendation Engine]
    L[MCP:<br>Master Control Program]
    J --> L
    K --> L
    L --> M[Agentic AI:<br>Generate Actionable Insights]
    M --> N{Create Zone-wise<br>Irrigation Plan}
    M --> O{Create Stage-Specific<br>Fertilizer Plan}
    M --> P{Generate Actionable Alerts}
  end

  %% Farmer-Facing App
  subgraph Farmer_App [Farmer-Facing App]
    Q[Integrated Dashboard]
    N --> Q
    O --> Q
    P --> Q
    Q --> R[Display Interactive Health Map]
    Q --> S[Show Recommendations & Crop Stage]
    Q --> T[Push Notifications & Alerts]
  end

  T --> U(End)

  %% Styling for start & end
  style A fill:#4CAF50,color:#fff,stroke:#388E3C,stroke-width:2px
  style U fill:#F44336,color:#fff,stroke:#D32F2F,stroke-width:2px

```


## 🧠 Core Components  

### 🧠 AI & ML Models Used  
- **MCLSTM (Multivariate Convolutional LSTM):** For capturing temporal + spatial crop growth changes  
- **DeepCGM (Deep Crop Growth Model):** For growth stage classification & nutrient health estimation  
- **Classification Model (Random Forest / XGBoost):** Fertilizer usage recommendation 

### 🔹 Data-Driven Insights  
- NDVI/NDRE analysis for vegetation health.  
- Soil fertility overlays for nutrient deficiencies.  
- Historical yield-weather fusion for better predictions.  

### 🔹 Optimized Potato Yield  
- Stage-specific irrigation recommendation.  
- Nitrogen-level mapping for targeted fertilizer use.  
- Precision farming for **higher yield with lower cost**.  

---
## 📊 Correlation Matrix
Understanding the relationships between variables in our dataset.

![Correlation Matrix](correlation_matrix.jpg)

---

## 🧹 Pre-processed Data
Sample of the cleaned and structured dataset used for training.

![Pre-processed Data](Satellite_image_preprocessed.jpg)

---

## ✅ Model Output
Accuracy results of the fertilizer recommendation model.

![Model Accuracy](accuracy_data.jpg)
