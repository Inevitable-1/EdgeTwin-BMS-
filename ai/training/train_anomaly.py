"""
EdgeTwin-BMS+ Anomaly Detection Model Training
Battery anomaly detection using Isolation Forest and Autoencoder
"""

import numpy as np
import pandas as pd
from typing import Optional, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score
import tensorflow as tf
from tensorflow import keras
import joblib
import json
from pathlib import Path
from datetime import datetime


class AnomalyDetector:
    """
    Battery anomaly detector using hybrid Isolation Forest + Autoencoder.
    
    Detects anomalous battery behavior that may indicate:
    - Cell degradation
    - BMS faults
    - Sensor failures
    - Thermal abuse
    """
    
    def __init__(self, n_features: int = 10, contamination: float = 0.1):
        self.n_features = n_features
        self.contamination = contamination
        self.isolation_forest = None
        self.autoencoder = None
        self.scaler = StandardScaler()
        self.threshold = None
        
    def generate_synthetic_data(self, n_samples: int = 10000, anomaly_ratio: float = 0.1) -> Tuple[pd.DataFrame, np.ndarray]:
        """
        Generate synthetic anomaly data.
        
        Normal data follows typical battery behavior.
        Anomalies are introduced with various patterns.
        """
        np.random.seed(42)
        
        n_normal = int(n_samples * (1 - anomaly_ratio))
        n_anomaly = n_samples - n_normal
        
        # Normal data
        normal_data = {
            'voltage': np.random.normal(3.7, 0.2, n_normal),
            'current': np.random.normal(0, 10, n_normal),
            'temperature': np.random.normal(30, 5, n_normal),
            'soc': np.random.normal(60, 15, n_normal),
            'voltage_std': np.random.normal(0.05, 0.02, n_normal),
            'current_std': np.random.normal(2, 1, n_normal),
            'temp_slope': np.random.normal(0, 0.5, n_normal),
            'voltage_imbalance': np.random.normal(0.02, 0.01, n_normal),
            'internal_resistance': np.random.normal(0.05, 0.01, n_normal),
            'power_efficiency': np.random.normal(0.95, 0.02, n_normal),
        }
        
        # Anomaly data (various patterns)
        anomaly_data = {
            'voltage': np.concatenate([
                np.random.normal(4.5, 0.3, n_anomaly // 3),  # Overvoltage
                np.random.normal(2.8, 0.2, n_anomaly // 3),  # Undervoltage
                np.random.normal(3.7, 0.5, n_anomaly - 2 * (n_anomaly // 3)),  # Erratic
            ]),
            'current': np.concatenate([
                np.random.normal(80, 10, n_anomaly // 3),  # Overcurrent
                np.random.normal(-80, 10, n_anomaly // 3),  # Reverse current
                np.random.normal(0, 30, n_anomaly - 2 * (n_anomaly // 3)),  # Erratic
            ]),
            'temperature': np.concatenate([
                np.random.normal(55, 5, n_anomaly // 3),  # Overheating
                np.random.normal(5, 2, n_anomaly // 3),  # Too cold
                np.random.normal(30, 15, n_anomaly - 2 * (n_anomaly // 3)),  # Erratic
            ]),
            'soc': np.random.uniform(0, 100, n_anomaly),
            'voltage_std': np.random.uniform(0.1, 0.5, n_anomaly),
            'current_std': np.random.uniform(5, 20, n_anomaly),
            'temp_slope': np.random.uniform(-5, 5, n_anomaly),
            'voltage_imbalance': np.random.uniform(0.1, 0.5, n_anomaly),
            'internal_resistance': np.random.uniform(0.08, 0.2, n_anomaly),
            'power_efficiency': np.random.uniform(0.7, 0.9, n_anomaly),
        }
        
        # Combine data
        df_normal = pd.DataFrame(normal_data)
        df_anomaly = pd.DataFrame(anomaly_data)
        df = pd.concat([df_normal, df_anomaly], ignore_index=True)
        
        # Labels (1 = normal, -1 = anomaly for Isolation Forest)
        labels = np.concatenate([np.ones(n_normal), -np.ones(n_anomaly)])
        
        # Shuffle
        indices = np.random.permutation(len(df))
        df = df.iloc[indices].reset_index(drop=True)
        labels = labels[indices]
        
        return df, labels
    
    def prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare features for training."""
        feature_columns = [
            'voltage', 'current', 'temperature', 'soc',
            'voltage_std', 'current_std', 'temp_slope',
            'voltage_imbalance', 'internal_resistance', 'power_efficiency'
        ]
        
        X = df[feature_columns].values
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled
    
    def train(self, data_path: Optional[str] = None):
        """Train the anomaly detection model."""
        print("[Anomaly] Starting training...")
        
        # Generate or load data
        if data_path and Path(data_path).exists():
            print(f"[Anomaly] Loading data from {data_path}")
            df = pd.read_csv(data_path)
            labels = np.ones(len(df))  # Assume all normal if no labels
        else:
            print("[Anomaly] Generating synthetic training data...")
            df, labels = self.generate_synthetic_data()
        
        # Prepare features
        X = self.prepare_features(df)
        
        print(f"[Anomaly] Training data shape: {X.shape}")
        
        # Train Isolation Forest
        print("[Anomaly] Training Isolation Forest...")
        self.isolation_forest = IsolationForest(
            contamination=self.contamination,
            n_estimators=200,
            max_samples='auto',
            random_state=42,
            n_jobs=-1
        )
        self.isolation_forest.fit(X)
        
        # Train Autoencoder for reconstruction-based anomaly detection
        print("[Anomaly] Training Autoencoder...")
        self.autoencoder = self.build_autoencoder()
        
        X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)
        
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss', patience=10, restore_best_weights=True
            ),
        ]
        
        self.autoencoder.fit(
            X_train, X_train,
            validation_data=(X_test, X_test),
            epochs=50,
            batch_size=32,
            callbacks=callbacks,
            verbose=1
        )
        
        # Calculate threshold based on reconstruction error
        X_reconstructed = self.autoencoder.predict(X_test)
        reconstruction_errors = np.mean(np.abs(X_test - X_reconstructed), axis=1)
        self.threshold = np.percentile(reconstruction_errors, 95)
        
        # Evaluate
        if np.any(labels == -1):
            # Evaluate on labeled data
            if_scores = self.isolation_forest.decision_function(X)
            if_predictions = self.isolation_forest.predict(X)
            
            # Convert to binary (1 = normal, 0 = anomaly)
            y_true = (labels == 1).astype(int)
            y_pred_if = (if_predictions == 1).astype(int)
            
            precision = precision_score(y_true, y_pred_if)
            recall = recall_score(y_true, y_pred_if)
            f1 = f1_score(y_true, y_pred_if)
            
            print(f"\n[Anomaly] Test Results:")
            print(f"  Precision: {precision:.4f}")
            print(f"  Recall: {recall:.4f}")
            print(f"  F1 Score: {f1:.4f}")
            
            return {'precision': precision, 'recall': recall, 'f1': f1}
        
        print(f"\n[Anomaly] Training complete (threshold: {self.threshold:.4f})")
        return {'threshold': float(self.threshold)}
    
    def build_autoencoder(self) -> keras.Model:
        """Build autoencoder for anomaly detection."""
        # Encoder
        encoder_input = keras.layers.Input(shape=(self.n_features,))
        x = keras.layers.Dense(32, activation='relu')(encoder_input)
        x = keras.layers.BatchNormalization()(x)
        x = keras.layers.Dropout(0.2)(x)
        x = keras.layers.Dense(16, activation='relu')(x)
        bottleneck = keras.layers.Dense(8, activation='relu')(x)
        
        # Decoder
        x = keras.layers.Dense(16, activation='relu')(bottleneck)
        x = keras.layers.BatchNormalization()(x)
        x = keras.layers.Dropout(0.2)(x)
        x = keras.layers.Dense(32, activation='relu')(x)
        decoder_output = keras.layers.Dense(self.n_features, activation='linear')(x)
        
        autoencoder = keras.Model(encoder_input, decoder_output)
        autoencoder.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse'
        )
        
        return autoencoder
    
    def predict(self, features: np.ndarray) -> Tuple[float, bool]:
        """
        Predict anomaly score and whether input is anomalous.
        
        Returns:
            Tuple of (anomaly_score, is_anomaly)
        """
        if self.isolation_forest is None or self.autoencoder is None:
            raise ValueError("Models not trained. Call train() first.")
        
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        
        # Isolation Forest score
        if_score = self.isolation_forest.decision_function(features_scaled)[0]
        if_normalized = 1 / (1 + np.exp(if_score))  # Sigmoid normalization
        
        # Autoencoder reconstruction error
        reconstructed = self.autoencoder.predict(features_scaled, verbose=0)
        recon_error = np.mean(np.abs(features_scaled - reconstructed))
        
        # Combined score (average of both methods)
        combined_score = (if_normalized + min(recon_error / self.threshold, 1.0)) / 2
        
        is_anomaly = combined_score > 0.5
        
        return float(combined_score), bool(is_anomaly)
    
    def save_models(self, model_dir: str = "models"):
        """Save trained models and scaler."""
        Path(model_dir).mkdir(parents=True, exist_ok=True)
        
        joblib.dump(self.isolation_forest, f"{model_dir}/anomaly_isolation_forest.pkl")
        self.autoencoder.save(f"{model_dir}/anomaly_autoencoder.keras")
        joblib.dump(self.scaler, f"{model_dir}/anomaly_scaler.pkl")
        
        metadata = {
            'model_type': 'anomaly',
            'model_architecture': 'isolation_forest + autoencoder',
            'n_features': self.n_features,
            'contamination': self.contamination,
            'threshold': float(self.threshold) if self.threshold else None,
            'trained_at': datetime.now().isoformat(),
        }
        
        with open(f"{model_dir}/anomaly_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"[Anomaly] Models saved to {model_dir}/")
    
    def load_models(self, model_dir: str = "models"):
        """Load trained models and scaler."""
        self.isolation_forest = joblib.load(f"{model_dir}/anomaly_isolation_forest.pkl")
        self.autoencoder = keras.models.load_model(f"{model_dir}/anomaly_autoencoder.keras")
        self.scaler = joblib.load(f"{model_dir}/anomaly_scaler.pkl")
        
        with open(f"{model_dir}/anomaly_metadata.json", 'r') as f:
            metadata = json.load(f)
            self.threshold = metadata.get('threshold')
        
        print(f"[Anomaly] Models loaded from {model_dir}/")


if __name__ == "__main__":
    detector = AnomalyDetector()
    results = detector.train()
    detector.save_models()
    
    print("\n[Anomaly] Training complete!")
    print(f"Results: {results}")
