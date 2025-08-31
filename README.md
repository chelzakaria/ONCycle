<div align="center">
	<br>
  <p>
    <a href="">
      <img src="ui\client\public\logo.svg" width="100" alt="ONCycle" />
    </a>
  </p>
  <p>
    <b style="font-size:2rem;">ONCycle</b>
  </p>
</div>

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Demo](#demo)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Model Performance](#model-performance)
- [References](#references)
- [Legal Notice](#legal-notice)
- [License](#license)

## Project Overview
ONCycle is a platform designed to follow the status of trains delays in real-time. It provides users with the ability to track train delays, view historical data, and predict future delays based on historical patterns.

## Features
  - Real-time train delay tracking
  - Historical delay data visualization
  - Predictive analytics for future delays
  - User-friendly interface
  - Responsive design for mobile and desktop

## Demo
![ONCycle Demo](ui/client/public/ONCycle_preview.gif)

[Check out the full website here](https://www.oncycle.live/)

## Project Structure

<img width="986" height="551" alt="Structure" src="https://github.com/user-attachments/assets/c9a9ddc5-7b13-49cd-8562-ef355ad4b135" />


### Repository Structure

```
ONCycle/
├── app/                                      # Main application package
│   ├── main.py                               # FastAPI app entry point
│   ├── api/routes/                           # API endpoint definitions
│   │   ├── health.py                         # Health check endpoints
│   │   └── prediction.py                     # ML prediction endpoints
│   ├── core/                                 # Core application components
│   │   ├── config.py                         # Configuration management
│   │   └── logging.py                        # Logging setup
│   ├── models/                               # ML model classes
│   │   └── predictors.py                     # Prediction model implementations
│   ├── schemas/                              # Pydantic data validation
│   │   └── prediction.py                     # Request/response schemas
│   └── services/                             # Business logic layer
│       └── model_service.py                  # Model loading and inference
├── models/                                   # Trained model files (.joblib)
├── scripts/                                  # Utility scripts
│   ├── train_models.py                       # Model training script
│   ├── test_api.py                           # API testing script
│   └── run_dev.py                            # Development server runner
├── requirements.txt                          # App dependencies
├── ui/                                       # User Interface package
│   ├── client/                               # React frontend (Vite + TypeScript)
│   └── server/                               # NextJS backend for SSR
├── experiments/                              # Model development and research
│   ├── notebooks/                            # Jupyter notebooks for analysis
|   |   ├── 00_data_cleaning.ipynb            # Initial data cleaning and exploration
|   |   ├── 01_EDA.ipynb                      # Exploratory Data Analysis
|   |   └── 02_model_selection.ipynb          # Model selection and evaluation
|   ├──scripts/                               # Utility scripts for experiments
|   ├──screenshots/                           # EDA and results screenshots
│   ├── data/                                 # Training data
│   ├── models/                               # Experimental models
|   └── README.md                             # Model metrics history
```

## Technologies Used
- Interface: [React](https://react.dev/), [ViteJS](https://vite.dev/), [Tremor](https://tremor.so/), [Tremor Blocks](https://blocks.tremor.so/blocks)
- Backend: [FastAPI](https://fastapi.tiangolo.com/), [NextJS](https://nextjs.org/)
- Database: [PostgreSQL](https://www.postgresql.org/), [Supabase](https://supabase.com/)
- Modeling: [Python](https://www.python.org/), [Scikit-learn](https://scikit-learn.org/), [XGBoost](https://xgboost.readthedocs.io/en/stable/)
- Deployment: [DigitalOcean](https://www.digitalocean.com/), [Vercel](https://vercel.com/)

## Development Process

#### 1. Data Science & Modeling
- **Data Exploration**: Explored and visualized historical train delay data to identify trends and anomalies.
- **Feature Engineering**: Developed temporal (hour, day, month) and route-specific features to enhance predictive power.
- **Model Experimentation**: Evaluated multiple algorithms; selected XGBoost for its superior performance (high accuracy, fast training/inference times, and low resource consumption).
- **Validation & Testing**: Used cross-validation  to ensure model robustness and generalizability.

#### 2. Backend Engineering
- **API Architecture**: Designed RESTful APIs using FastAPI for efficient communication between frontend and backend.
- **Model Deployment**: Implemented scalable model serving with optimized loading and inference pipelines.
- **Data Integrity**: Leveraged Pydantic for strict request/response validation and type safety.
- **Monitoring**: Integrated logging and health checks for reliability.

#### 3. Frontend Development
- **User Interface**: Built a modern, accessible UI with React, Vite, and Tremor components.
- **State Management**: Implemented efficient state handling and caching for smooth user experience.
- **Responsiveness**: Ensured seamless usability across devices with a mobile-first design.

#### 4. Continuous Improvement
- **Continuous model training and monitoring**: Regularly updated the model with new data to maintain accuracy.
- **Documentation**: Maintained clear documentation for contributors and users.


## Model Performance

Our machine learning model is trained on historical train data and achieves:

| Metric | Value |
|--------|-------|
| **R² Score** | 0.944 |
| **Mean Absolute Error** | 2.64 minutes |
| **Features Used** | 29 |
| **Training Samples** | 198,604  |
| **Model Version** | v1.0 |
> Model metrics history: [experiments/README.md](./experiments/README.md)

The model uses **XGBoost** with engineered features including:
- Temporal features (hour, day of week, month)
- Route characteristics (distance, duration, route, number of stops, sequence...)
- Historical delay patterns


## References
- [Short-term train arrival delay prediction: a data-driven approach](https://www.emerald.com/rs/article/3/4/514/1227997/Short-term-train-arrival-delay-prediction-a-data)&nbsp;<sup>[Paper]</sup>
- [A review of data-driven approaches to predict train delays](https://www.sciencedirect.com/science/article/pii/S0968090X23000165)&nbsp;<sup>[Paper]</sup>
- [Prediction of rail transit delays with machine learning: How to exploit open data sources](https://www.sciencedirect.com/science/article/pii/S2772586324000017)&nbsp;<sup>[Paper]</sup>
- [RATPstatus.fr](https://ratpstatus.fr/)&nbsp;<sup>[Inspiration]</sup>
- [xgboosting](https://xgboosting.com/use-xgboost-feature-importance-for-incremental-feature-selection/)&nbsp;<sup>[Code]</sup>



## Legal Notice
This project is not affiliated with or endorsed by ONCF or any other official railway authority. It is an independent project created for <b>educational</b> and <b>proof of concept (POC)</b> purposes.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
