"""
EdgeTwin-BMS+ RUL Prediction Model Training
Remaining Useful Life prediction using LightGBM
"""

import numpy as np
import pandas as pd
from typing import Optional, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import lightgbm as lgb
import joblib
import json
from pathlib import Path
from datetime import datetime


class RULPredictor:
    """
    Remaining Useful Life (RUL) predictor using LightGBM.
    
    RUL estimation predicts how many charge cycles remain before
    the battery reaches end-of-life (typically 70-80% SOH).
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        
    def generate_synthetic_data(self, n_samples: int = 10000) -> pd.DataFrame:
        """
        Generate synthetic RUL training data.
        
        In production, use real battery aging data from cycling tests.
        """
        np.random.seed(42)
        
        data = {
            'voltage': np.random.uniform(3.0, 4.2, n_samples),
            'current': np.random.uniform(-50, 50, n_samples),
            'temperature': np.random.uniform(15, 45, n_samples),
            'soc': np.random.uniform(10, 90, n_samples),
            'soh': np.random.uniform(60, 100, n_samples),
            'cycle_count': np.random.randint(0, 2000, n_samples),
            'avg_charge_voltage': np.random.uniform(3.8, 4.1, n_samples),
            'avg_discharge_voltage': np.random.uniform(3.4, 3.8, n_samples),
            'charge_time': np.random.uniform(30, 120, n_samples),
            'discharge_time': np.random.uniform(30, 180, n_samples),
            'capacity_fade_rate': np.random.uniform(0.001, 0.01, n_samples),
            'internal_resistance': np.random.uniform(0.01, 0.1, n_samples),
        }
        
        df = pd.DataFrame(data)
        
        # Calculate RUL based on SOH and degradation patterns
        # RUL = f(SOH, cycle_count, degradation_rate)
        soh_factor = (df['soh'] - 70) / 30  # Normalized SOH above 70%
        cycle_factor = 1 - df['cycle_count'] / 2000
        fade_factor = 1 - df['capacity_fade_rate'] * 100
        
        df['rul'] = np.clip(
            soh_factor * cycle_factor * fade_factor * 1500 + np.random.normal(0, 50, n_samples),
            0, 2000
        )
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and labels for training."""
        feature_columns = [
            'voltage', 'current', 'temperature', 'soc', 'soh',
            'cycle_count', 'avg_charge_voltage', 'avg_discharge_voltage',
            'charge_time', 'discharge_time', 'capacity_fade_rate',
            'internal_resistance'
        ]
        
        X = df[feature_columns].values
        y = df['rul'].values
        
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y
    
    def train(self, data_path: Optional[str] = None, n_estimators: int = 1000):
        """Train the RUL prediction model."""
        print("[RUL] Starting training...")
        
        # Generate or load data
        if data_path and Path(data_path).exists():
            print(f"[RUL] Loading data from {data_path}")
            df = pd.read_csv(data_path)
        else:
            print("[RUL] Generating synthetic training data...")
            df = self.generate_synthetic_data()
        
        # Prepare features
        X, y = self.prepare_features(df)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        print(f"[RUL] Training data shape: {X_train.shape}")
        print(f"[RUL] Test data shape: {X_test.shape}")
        
        # Train LightGBM model
        train_data = lgb.Dataset(X_train, label=y_train)
        valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
        
        params = {
            'objective': 'regression',
            'metric': 'rmse',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.8,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
        }
        
        self.model = lgb.train(
            params,
            train_data,
            num_boost_round=n_estimators,
            valid_sets=[valid_data],
            callbacks=[
                lgb.early_stopping(stopping_rounds=50),
                lgb.log_evaluation(period=100),
            ],
        )
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"\n[RUL] Test Results:")
        print(f"  MSE: {mse:.6f}")
        print(f"  MAE: {mae:.4f}")
        print(f"  R2: {r2:.4f}")
        
        return {'mse': mse, 'mae': mae, 'r2': r2}
    
    def predict(self, features: np.ndarray) -> float:
        """Predict RUL for input features."""
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        prediction = self.model.predict(features_scaled)
        
        return float(prediction[0])
    
    def save_models(self, model_dir: str = "models"):
        """Save trained model and scaler."""
        Path(model_dir).mkdir(parents=True, exist_ok=True)
        
        self.model.save_model(f"{model_dir}/rul_lgbm_model.txt")
        joblib.dump(self.scaler, f"{model_dir}/rul_scaler.pkl")
        
        metadata = {
            'model_type': 'rul',
            'model_architecture': 'lightgbm',
            'trained_at': datetime.now().isoformat(),
            'num_trees': self.model.num_trees(),
        }
        
        with open(f"{model_dir}/rul_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"[RUL] Models saved to {model_dir}/")
    
    def load_models(self, model_dir: str = "models"):
        """Load trained model and scaler."""
        self.model = lgb.Booster(model_file=f"{model_dir}/rul_lgbm_model.txt")
        self.scaler = joblib.load(f"{model_dir}/rul_scaler.pkl")
        
        print(f"[RUL] Models loaded from {model_dir}/")


if __name__ == "__main__":
    predictor = RULPredictor()
    results = predictor.train()
    predictor.save_models()
    
    print("\n[RUL] Training complete!")
    print(f"Results: {results}")
