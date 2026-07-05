"""
EdgeTwin-BMS+ Thermal Risk Prediction Model Training
Thermal runaway risk prediction using neural network
"""

import numpy as np
import pandas as pd
from typing import Optional, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import tensorflow as tf
from tensorflow import keras
import joblib
import json
from pathlib import Path
from datetime import datetime


class ThermalRiskPredictor:
    """
    Thermal risk predictor using neural network.
    
    Predicts the probability of thermal runaway based on
    temperature patterns, voltage imbalance, and current profiles.
    """
    
    def __init__(self, n_features: int = 12):
        self.n_features = n_features
        self.model = None
        self.scaler = StandardScaler()
        
    def generate_synthetic_data(self, n_samples: int = 10000) -> pd.DataFrame:
        """
        Generate synthetic thermal risk training data.
        
        In production, use real thermal abuse test data.
        """
        np.random.seed(42)
        
        data = {
            'avg_temperature': np.random.uniform(20, 60, n_samples),
            'max_temperature': np.random.uniform(25, 80, n_samples),
            'temp_std': np.random.uniform(0.5, 10, n_samples),
            'temp_slope': np.random.uniform(-2, 5, n_samples),
            'voltage': np.random.uniform(3.0, 4.2, n_samples),
            'voltage_imbalance': np.random.uniform(0, 0.3, n_samples),
            'current': np.random.uniform(-50, 50, n_samples),
            'current_ripple': np.random.uniform(0, 10, n_samples),
            'soc': np.random.uniform(10, 100, n_samples),
            'soh': np.random.uniform(60, 100, n_samples),
            'ambient_temp': np.random.uniform(15, 40, n_samples),
            'cooling_efficiency': np.random.uniform(0.3, 1.0, n_samples),
        }
        
        df = pd.DataFrame(data)
        
        # Calculate thermal risk score (0-1)
        # Based on temperature proximity to thresholds and other factors
        temp_risk = np.clip((df['max_temperature'] - 45) / 35, 0, 1)
        imbalance_risk = np.clip(df['voltage_imbalance'] / 0.3, 0, 1)
        current_risk = np.clip(np.abs(df['current']) / 100, 0, 1)
        cooling_factor = 1 - df['cooling_efficiency']
        
        df['thermal_risk'] = np.clip(
            0.4 * temp_risk + 
            0.25 * imbalance_risk + 
            0.2 * current_risk + 
            0.15 * cooling_factor +
            np.random.normal(0, 0.05, n_samples),
            0, 1
        )
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and labels for training."""
        feature_columns = [
            'avg_temperature', 'max_temperature', 'temp_std', 'temp_slope',
            'voltage', 'voltage_imbalance', 'current', 'current_ripple',
            'soc', 'soh', 'ambient_temp', 'cooling_efficiency'
        ]
        
        X = df[feature_columns].values
        y = df['thermal_risk'].values
        
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y
    
    def build_model(self) -> keras.Model:
        """Build neural network for thermal risk prediction."""
        model = keras.Sequential([
            keras.layers.Dense(64, activation='relu', input_shape=(self.n_features,)),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(16, activation='relu'),
            keras.layers.Dense(1, activation='sigmoid')  # Output 0-1 risk score
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['mae', 'accuracy']
        )
        
        return model
    
    def train(self, data_path: Optional[str] = None, epochs: int = 100, batch_size: int = 32):
        """Train the thermal risk prediction model."""
        print("[Thermal] Starting training...")
        
        # Generate or load data
        if data_path and Path(data_path).exists():
            print(f"[Thermal] Loading data from {data_path}")
            df = pd.read_csv(data_path)
        else:
            print("[Thermal] Generating synthetic training data...")
            df = self.generate_synthetic_data()
        
        # Prepare features
        X, y = self.prepare_features(df)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        print(f"[Thermal] Training data shape: {X_train.shape}")
        print(f"[Thermal] Test data shape: {X_test.shape}")
        
        # Build and train model
        self.model = self.build_model()
        
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss', patience=10, restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss', factor=0.5, patience=5
            ),
        ]
        
        self.history = self.model.fit(
            X_train, y_train,
            validation_split=0.2,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate
        y_pred = self.model.predict(X_test).flatten()
        
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Binary classification metrics
        y_pred_binary = (y_pred > 0.5).astype(int)
        y_test_binary = (y_test > 0.5).astype(int)
        accuracy = np.mean(y_pred_binary == y_test_binary)
        
        print(f"\n[Thermal] Test Results:")
        print(f"  MSE: {mse:.6f}")
        print(f"  MAE: {mae:.4f}")
        print(f"  R2: {r2:.4f}")
        print(f"  Accuracy: {accuracy:.4f}")
        
        return {'mse': mse, 'mae': mae, 'r2': r2, 'accuracy': accuracy}
    
    def predict(self, features: np.ndarray) -> float:
        """Predict thermal risk score for input features."""
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        prediction = self.model.predict(features_scaled, verbose=0)
        
        return float(prediction[0][0])
    
    def save_models(self, model_dir: str = "models"):
        """Save trained model and scaler."""
        Path(model_dir).mkdir(parents=True, exist_ok=True)
        
        self.model.save(f"{model_dir}/thermal_risk_model.keras")
        joblib.dump(self.scaler, f"{model_dir}/thermal_risk_scaler.pkl")
        
        metadata = {
            'model_type': 'thermal_risk',
            'model_architecture': 'neural_network',
            'n_features': self.n_features,
            'trained_at': datetime.now().isoformat(),
            'training_samples': len(self.history.history['loss']) if self.history else 0,
        }
        
        with open(f"{model_dir}/thermal_risk_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"[Thermal] Models saved to {model_dir}/")
    
    def load_models(self, model_dir: str = "models"):
        """Load trained model and scaler."""
        self.model = keras.models.load_model(f"{model_dir}/thermal_risk_model.keras")
        self.scaler = joblib.load(f"{model_dir}/thermal_risk_scaler.pkl")
        
        print(f"[Thermal] Models loaded from {model_dir}/")


if __name__ == "__main__":
    predictor = ThermalRiskPredictor()
    results = predictor.train(epochs=50)
    predictor.save_models()
    
    print("\n[Thermal] Training complete!")
    print(f"Results: {results}")
