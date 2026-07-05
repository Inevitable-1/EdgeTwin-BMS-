"""
EdgeTwin-BMS+ AI Model Evaluation
Comprehensive evaluation of all trained models
"""

import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report
)
from pathlib import Path
import json
from typing import Dict, Any


def evaluate_regression_model(y_true: np.ndarray, y_pred: np.ndarray, model_name: str) -> Dict[str, float]:
    """Evaluate a regression model."""
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    # Mean Absolute Percentage Error
    mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100
    
    results = {
        'model': model_name,
        'mse': float(mse),
        'rmse': float(rmse),
        'mae': float(mae),
        'r2': float(r2),
        'mape': float(mape),
    }
    
    print(f"\n{model_name} Results:")
    print(f"  MSE:  {mse:.6f}")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  MAE:  {mae:.4f}")
    print(f"  R2:   {r2:.4f}")
    print(f"  MAPE: {mape:.2f}%")
    
    return results


def evaluate_classification_model(y_true: np.ndarray, y_pred: np.ndarray, model_name: str) -> Dict[str, float]:
    """Evaluate a classification model."""
    precision = precision_score(y_true, y_pred, average='weighted')
    recall = recall_score(y_true, y_pred, average='weighted')
    f1 = f1_score(y_true, y_pred, average='weighted')
    accuracy = np.mean(y_true == y_pred)
    
    results = {
        'model': model_name,
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1),
    }
    
    print(f"\n{model_name} Results:")
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    
    return results


def generate_benchmark_report(results: Dict[str, Any], output_path: str = "evaluation/benchmarks.md"):
    """Generate a markdown benchmark report."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    report = """# EdgeTwin-BMS+ AI Model Benchmarks

## Evaluation Summary

| Model | Metric | Value |
|-------|--------|-------|
"""
    
    for model_name, metrics in results.items():
        for metric, value in metrics.items():
            if metric != 'model':
                report += f"| {model_name} | {metric} | {value:.4f} |\n"
    
    report += """
## Model Details

### SOH Prediction (State of Health)
- Architecture: LightGBM + LSTM Hybrid
- Input Features: Voltage, Current, Temperature, Cycle Count, etc.
- Target: Battery State of Health (0-100%)

### SOC Prediction (State of Charge)
- Architecture: LSTM Neural Network
- Input Features: Voltage, Current, Temperature, etc.
- Target: Battery State of Charge (0-100%)

### RUL Prediction (Remaining Useful Life)
- Architecture: LightGBM
- Input Features: SOH, Cycle Count, Degradation Rate, etc.
- Target: Remaining charge cycles (0-2000)

### Thermal Risk Prediction
- Architecture: Neural Network
- Input Features: Temperature, Voltage Imbalance, Current, etc.
- Target: Thermal risk score (0-1)

### Anomaly Detection
- Architecture: Isolation Forest + Autoencoder
- Input Features: Voltage, Current, Temperature patterns
- Target: Anomaly score and binary classification

## Evaluation Methodology

1. **Data Split**: 80% training, 20% test
2. **Cross-Validation**: 5-fold for hyperparameter tuning
3. **Metrics**: MSE, RMSE, MAE, R2 for regression; Precision, Recall, F1 for classification
4. **Baseline**: Comparison against simple heuristic methods

## Production Performance Targets

| Model | Metric | Target | Achieved |
|-------|--------|--------|----------|
| SOH | R2 | >0.95 | - |
| SOC | MAE | <2% | - |
| RUL | MAE | <100 cycles | - |
| Thermal | F1 | >0.90 | - |
| Anomaly | F1 | >0.85 | - |

*Note: Target values are based on industry standards for battery management systems.*
"""
    
    with open(output_path, 'w') as f:
        f.write(report)
    
    print(f"\nBenchmark report saved to {output_path}")


if __name__ == "__main__":
    # Example usage
    print("EdgeTwin-BMS+ Model Evaluation")
    print("=" * 50)
    
    # Generate sample evaluation
    np.random.seed(42)
    y_true = np.random.uniform(0, 100, 100)
    y_pred = y_true + np.random.normal(0, 5, 100)
    
    results = evaluate_regression_model(y_true, y_pred, "SOH Prediction")
    generate_benchmark_report({'SOH': results})
