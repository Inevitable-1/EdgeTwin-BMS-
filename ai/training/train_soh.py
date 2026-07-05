"""
EdgeTwin-BMS+ SOH Prediction Model Training
"""

import numpy as np
import pandas as pd
from typing import Optional, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import lightgbm as lgb
import tensorflow as tf
from tensorflow import keras
import joblib
import json
from pathlib import Path
from datetime import datetime


class SOHPredictor:
    """
    State of Health (SOH) prediction model.
    Uses a hybrid approach: LightGBM for feature-based prediction
    and LSTM for temporal patterns.
    """
    
    def __init__(self):
        self.lgb_model = None
        self.lstm_model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'voltage', 'current', 'temperature', 'soc',
            'cycle_count', 'voltage_std', 'current_std', 'temp_std',
            'voltage_mean', 'current_mean', 'temp_mean',
            'voltage_slope', 'current_slope', 'temp_slope',
            'energy_throughput', 'fast_charge_ratio'
        ]
    
    def generate_synthetic_data(self, n_samples: int = 10000) -> pd.DataFrame:
        """
        Generate synthetic battery data for training.
        In production, use real battery data.
        """
        np.random.seed(42)
        
        data = {
            'cycle_count': np.random.randint(0, 3000, n_samples),
            'voltage': np.random.normal(3.7, 0.2, n_samples),
            'current': np.random.normal(0, 30, n_samples),
            'temperature': np.random.normal(30, 10, n_samples),
            'soc': np.random.uniform(0, 100, n_samples),
            'voltage_std': np.random.uniform(0, 0.1, n_samples),
            'current_std': np.random.uniform(0, 5, n_samples),
            'temp_std': np.random.uniform(0, 3, n_samples),
            'voltage_mean': np.random.normal(3.7, 0.1, n_samples),
            'current_mean': np.random.normal(0, 20, n_samples),
            'temp_mean': np.random.normal(30, 5, n_samples),
            'voltage_slope': np.random.normal(0, 0.001, n_samples),
            'current_slope': np.random.normal(0, 0.1, n_samples),
            'temp_slope': np.random.normal(0, 0.05, n_samples),
            'energy_throughput': np.random.uniform(0, 50000, n_samples),
            'fast_charge_ratio': np.random.uniform(0, 1, n_samples),
        }
        
        df = pd.DataFrame(data)
        
        # Generate SOH based on degradation model
        cycle_degradation = df['cycle_count'] / 3000 * 30
        temp_degradation = np.maximum(0, df['temperature'] - 35) / 100 * 20
        fast_charge_degradation = df['fast_charge_ratio'] * 10
        
        df['soh'] = np.clip(
            100 - cycle_degradation - temp_degradation - fast_charge_degradation + np.random.normal(0, 2, n_samples),
            0, 100
        )
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        """Prepare features and target for training."""
        X = df[self.feature_names].values
        y = df['soh'].values
        
        return X, y
    
    def train_lgbm(self, X_train: np.ndarray, y_train: np.ndarray, 
                   X_val: np.ndarray, y_val: np.ndarray):
        """Train LightGBM model."""
        train_data = lgb.Dataset(X_train, label=y_train)
        val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)
        
        params = {
            'objective': 'regression',
            'metric': 'rmse',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
        }
        
        self.lgb_model = lgb.train(
            params,
            train_data,
            valid_sets=[val_data],
            num_boost_round=1000,
            callbacks=[lgb.early_stopping(50), lgb.log_evaluation(100)],
        )
        
        return self.lgb_model
    
    def build_lstm_model(self, input_shape: tuple) -> keras.Model:
        """Build LSTM model for temporal patterns."""
        model = keras.Sequential([
            keras.layers.LSTM(64, return_sequences=True, input_shape=input_shape),
            keras.layers.Dropout(0.2),
            keras.layers.LSTM(32),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(16, activation='relu'),
            keras.layers.Dense(1),
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae'],
        )
        
        return model
    
    def train_lstm(self, X_train: np.ndarray, y_train: np.ndarray,
                   X_val: np.ndarray, y_val: np.ndarray, epochs: int = 100):
        """Train LSTM model."""
        # Reshape for LSTM: [samples, timesteps, features]
        X_train_lstm = X_train.reshape((X_train.shape[0], 1, X_train.shape[1]))
        X_val_lstm = X_val.reshape((X_val.shape[0], 1, X_val.shape[1]))
        
        self.lstm_model = self.build_lstm_model((1, X_train.shape[1]))
        
        callbacks = [
            keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
            keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5),
        ]
        
        history = self.lstm_model.fit(
            X_train_lstm, y_train,
            validation_data=(X_val_lstm, y_val),
            epochs=epochs,
            batch_size=32,
            callbacks=callbacks,
            verbose=1,
        )
        
        return history
    
    def train(self, data_path: Optional[str] = None):
        """Train both models."""
        print("=" * 60)
        print("EdgeTwin-BMS+ SOH Model Training")
        print("=" * 60)
        
        # Load or generate data
        if data_path and Path(data_path).exists():
            print(f"\nLoading data from {data_path}")
            df = pd.read_csv(data_path)
        else:
            print("\nGenerating synthetic training data...")
            df = self.generate_synthetic_data(10000)
            # Save generated data
            df.to_csv('training_data_soh.csv', index=False)
        
        # Prepare features
        X, y = self.prepare_features(df)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42
        )
        
        print(f"\nTraining set: {X_train.shape[0]} samples")
        print(f"Validation set: {X_val.shape[0]} samples")
        print(f"Test set: {X_test.shape[0]} samples")
        
        # Train LightGBM
        print("\n--- Training LightGBM Model ---")
        self.train_lgbm(X_train, y_train, X_val, y_val)
        
        # Evaluate LightGBM
        lgb_pred = self.lgb_model.predict(X_test)
        lgb_rmse = np.sqrt(mean_squared_error(y_test, lgb_pred))
        lgb_mae = mean_absolute_error(y_test, lgb_pred)
        lgb_r2 = r2_score(y_test, lgb_pred)
        
        print(f"\nLightGBM Results:")
        print(f"  RMSE: {lgb_rmse:.4f}")
        print(f"  MAE: {lgb_mae:.4f}")
        print(f"  R²: {lgb_r2:.4f}")
        
        # Train LSTM
        print("\n--- Training LSTM Model ---")
        self.train_lstm(X_train, y_train, X_val, y_val, epochs=50)
        
        # Evaluate LSTM
        X_test_lstm = X_test.reshape((X_test.shape[0], 1, X_test.shape[1]))
        lstm_pred = self.lstm_model.predict(X_test_lstm, verbose=0).flatten()
        lstm_rmse = np.sqrt(mean_squared_error(y_test, lstm_pred))
        lstm_mae = mean_absolute_error(y_test, lstm_pred)
        lstm_r2 = r2_score(y_test, lstm_pred)
        
        print(f"\nLSTM Results:")
        print(f"  RMSE: {lstm_rmse:.4f}")
        print(f"  MAE: {lstm_mae:.4f}")
        print(f"  R²: {lstm_r2:.4f}")
        
        # Save models and metrics
        self.save_models()
        
        metrics = {
            'lgbm': {'rmse': lgb_rmse, 'mae': lgb_mae, 'r2': lgb_r2},
            'lstm': {'rmse': lstm_rmse, 'mae': lstm_mae, 'r2': lstm_r2},
            'training_date': datetime.now().isoformat(),
            'samples': len(df),
        }
        
        with open('soh_model_metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        
        print("\n" + "=" * 60)
        print("Training complete! Models saved.")
        print("=" * 60)
        
        return metrics
    
    def save_models(self):
        """Save trained models."""
        output_dir = Path('models')
        output_dir.mkdir(exist_ok=True)
        
        # Save LightGBM model
        self.lgb_model.save_model(output_dir / 'soh_lgbm.txt')
        
        # Save LSTM model
        self.lstm_model.save(output_dir / 'soh_lstm')
        
        # Save scaler
        joblib.dump(self.scaler, output_dir / 'soh_scaler.pkl')
        
        print(f"Models saved to {output_dir}")
    
    def load_models(self):
        """Load trained models."""
        output_dir = Path('models')
        
        self.lgb_model = lgb.Booster(model_file=output_dir / 'soh_lgbm.txt')
        self.lstm_model = keras.models.load_model(output_dir / 'soh_lstm')
        self.scaler = joblib.load(output_dir / 'soh_scaler.pkl')
        
        print("Models loaded successfully")
    
    def predict(self, features: np.ndarray) -> dict:
        """Make prediction using ensemble of models."""
        # Scale features
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        
        # LightGBM prediction
        lgb_pred = self.lgb_model.predict(features_scaled)[0]
        
        # LSTM prediction
        features_lstm = features_scaled.reshape(1, 1, -1)
        lstm_pred = self.lstm_model.predict(features_lstm, verbose=0)[0][0]
        
        # Ensemble (weighted average)
        ensemble_pred = 0.7 * lgb_pred + 0.3 * lstm_pred
        
        return {
            'soh': float(ensemble_pred),
            'lgbm_soh': float(lgb_pred),
            'lstm_soh': float(lstm_pred),
            'confidence': float(min(0.95, max(0.5, 1 - abs(lgb_pred - lstm_pred) / 100))),
        }


if __name__ == "__main__":
    predictor = SOHPredictor()
    metrics = predictor.train()
    
    print("\nFinal Metrics:")
    print(json.dumps(metrics, indent=2))
