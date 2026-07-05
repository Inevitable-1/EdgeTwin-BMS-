"""
EdgeTwin-BMS+ SOC Prediction Model Training
State of Charge estimation using LSTM neural network
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


class SOCPredictor:
    """
    State of Charge (SOC) predictor using LSTM neural network.
    
    SOC estimation is critical for battery management systems to
    determine remaining range and prevent deep discharge.
    """
    
    def __init__(self, sequence_length: int = 30, n_features: int = 8):
        self.sequence_length = sequence_length
        self.n_features = n_features
        self.model = None
        self.scaler = StandardScaler()
        self.history = None
        
    def generate_synthetic_data(self, n_samples: int = 10000) -> pd.DataFrame:
        """
        Generate synthetic SOC training data.
        
        In production, use real battery cycling data from:
        - NASA Battery Dataset
        - Oxford Battery Degradation Dataset
        - Custom collected data
        """
        np.random.seed(42)
        
        data = {
            'voltage': np.random.uniform(3.0, 4.2, n_samples),
            'current': np.random.uniform(-50, 50, n_samples),
            'temperature': np.random.uniform(15, 45, n_samples),
            'soc': np.zeros(n_samples),
            'cycle_count': np.random.randint(0, 1000, n_samples),
            'time_delta': np.random.uniform(1, 10, n_samples),
            'power': np.zeros(n_samples),
            'internal_resistance': np.random.uniform(0.01, 0.1, n_samples),
        }
        
        df = pd.DataFrame(data)
        
        # Calculate SOC based on OCV-SOC relationship (simplified)
        # SOC = f(OCV, temperature, current, degradation)
        v_norm = (df['voltage'] - 3.0) / 1.2  # Normalize voltage
        temp_factor = 1 - 0.005 * (df['temperature'] - 25)  # Temperature correction
        current_factor = 1 - 0.001 * df['current']  # Current correction
        cycle_factor = 1 - 0.0001 * df['cycle_count']  # Degradation
        
        df['soc'] = np.clip(v_norm * temp_factor * current_factor * cycle_factor * 100, 0, 100)
        df['power'] = df['voltage'] * df['current'] / 1000  # kW
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and labels for training."""
        feature_columns = [
            'voltage', 'current', 'temperature', 'cycle_count',
            'time_delta', 'power', 'internal_resistance'
        ]
        
        X = df[feature_columns].values
        y = df['soc'].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Create sequences for LSTM
        X_seq, y_seq = [], []
        for i in range(len(X_scaled) - self.sequence_length):
            X_seq.append(X_scaled[i:i + self.sequence_length])
            y_seq.append(y[i + self.sequence_length])
        
        return np.array(X_seq), np.array(y_seq)
    
    def build_model(self) -> keras.Model:
        """Build LSTM model for SOC prediction."""
        model = keras.Sequential([
            keras.layers.LSTM(64, return_sequences=True, 
                            input_shape=(self.sequence_length, self.n_features - 1)),
            keras.layers.Dropout(0.2),
            keras.layers.LSTM(32, return_sequences=False),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(16, activation='relu'),
            keras.layers.Dense(1, activation='sigmoid')  # Output 0-1 (0-100%)
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def train(self, data_path: Optional[str] = None, epochs: int = 100, batch_size: int = 32):
        """Train the SOC prediction model."""
        print("[SOC] Starting training...")
        
        # Generate or load data
        if data_path and Path(data_path).exists():
            print(f"[SOC] Loading data from {data_path}")
            df = pd.read_csv(data_path)
        else:
            print("[SOC] Generating synthetic training data...")
            df = self.generate_synthetic_data()
        
        # Prepare features
        X, y = self.prepare_features(df)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        print(f"[SOC] Training data shape: {X_train.shape}")
        print(f"[SOC] Test data shape: {X_test.shape}")
        
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
        
        print(f"\n[SOC] Test Results:")
        print(f"  MSE: {mse:.6f}")
        print(f"  MAE: {mae:.4f}")
        print(f"  R2: {r2:.4f}")
        
        return {'mse': mse, 'mae': mae, 'r2': r2}
    
    def predict(self, features: np.ndarray) -> float:
        """Predict SOC for input features."""
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        features_seq = features_scaled.reshape(1, self.sequence_length, -1)
        
        prediction = self.model.predict(features_seq, verbose=0)
        return float(prediction[0][0] * 100)  # Convert to percentage
    
    def save_models(self, model_dir: str = "models"):
        """Save trained model and scaler."""
        Path(model_dir).mkdir(parents=True, exist_ok=True)
        
        self.model.save(f"{model_dir}/soc_lstm_model.keras")
        joblib.dump(self.scaler, f"{model_dir}/soc_scaler.pkl")
        
        # Save metadata
        metadata = {
            'model_type': 'soc',
            'model_architecture': 'lstm',
            'sequence_length': self.sequence_length,
            'n_features': self.n_features,
            'trained_at': datetime.now().isoformat(),
            'training_samples': len(self.history.history['loss']) if self.history else 0,
        }
        
        with open(f"{model_dir}/soc_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"[SOC] Models saved to {model_dir}/")
    
    def load_models(self, model_dir: str = "models"):
        """Load trained model and scaler."""
        self.model = keras.models.load_model(f"{model_dir}/soc_lstm_model.keras")
        self.scaler = joblib.load(f"{model_dir}/soc_scaler.pkl")
        
        with open(f"{model_dir}/soc_metadata.json", 'r') as f:
            metadata = json.load(f)
            self.sequence_length = metadata['sequence_length']
            self.n_features = metadata['n_features']
        
        print(f"[SOC] Models loaded from {model_dir}/")


if __name__ == "__main__":
    predictor = SOCPredictor()
    results = predictor.train(epochs=50)
    predictor.save_models()
    
    print("\n[SOC] Training complete!")
    print(f"Results: {results}")
