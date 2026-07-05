# UI Color Palette

## Tesla/Tata-Inspired Industrial Design System

---

## 1. Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Deep Space** | `#0a0a1a` | 10, 10, 26 | Main background |
| **Surface Dark** | `#12121e` | 18, 18, 30 | Card background |
| **Surface Hover** | `#1a1a2e` | 26, 26, 46 | Card hover state |
| **Surface Active** | `#22223a` | 34, 34, 58 | Active elements |

---

## 2. Accent Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Electric Blue** | `#3b82f6` | 59, 130, 246 | Primary actions, links |
| **Cyan Glow** | `#06b6d4` | 6, 182, 212 | Data visualization |
| **Purple Neon** | `#8b5cf6` | 139, 92, 246 | Predictions, AI elements |
| **Teal Accent** | `#14b8a6` | 20, 184, 166 | Success states |

---

## 3. Status Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Safe Green** | `#00ff88` | 0, 255, 136 | Safe status, positive |
| **Warning Yellow** | `#ffd700` | 255, 215, 0 | Warning states |
| **Critical Orange** | `#ff8c00` | 255, 140, 0 | Critical alerts |
| **Emergency Red** | `#ff0000` | 255, 0, 0 | Emergency, failure |
| **Info Blue** | `#60a5fa` | 96, 165, 250 | Informational |

---

## 4. Text Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Text Primary** | `#ffffff` | 255, 255, 255 | Headings, important text |
| **Text Secondary** | `#a0a0b0` | 160, 160, 176 | Body text, descriptions |
| **Text Muted** | `#606070` | 96, 96, 112 | Labels, placeholders |
| **Text Disabled** | `#404050` | 64, 64, 80 | Disabled elements |

---

## 5. Border Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Border Default** | `#2a2a3a` | 42, 42, 58 | Default borders |
| **Border Active** | `#3b82f6` | 59, 130, 246 | Focus, active borders |
| **Border Success** | `#00ff88` | 0, 255, 136 | Success borders |
| **Border Warning** | `#ffd700` | 255, 215, 0 | Warning borders |
| **Border Danger** | `#ff0000` | 255, 0, 0 | Error borders |

---

## 6. Gradient Palettes

### Battery Health Gradient
```css
.battery-health-gradient {
    background: linear-gradient(135deg, 
        #00ff88 0%,      /* 100% - Safe */
        #88ff00 25%,     /* 75% - Good */
        #ffd700 50%,     /* 50% - Warning */
        #ff8c00 75%,     /* 25% - Critical */
        #ff0000 100%     /* 0% - Emergency */
    );
}
```

### Thermal Gradient
```css
.thermal-gradient {
    background: linear-gradient(180deg,
        #0066ff 0%,      /* Cold (-20°C) */
        #00ffff 25%,     /* Cool (0°C) */
        #00ff88 50%,     /* Normal (25°C) */
        #ffd700 75%,     /* Warm (40°C) */
        #ff0000 100%     /* Hot (60°C+) */
    );
}
```

### Risk Gradient
```css
.risk-gradient {
    background: linear-gradient(90deg,
        #00ff88 0%,      /* Safe */
        #ffd700 33%,     /* Warning */
        #ff8c00 66%,     /* Critical */
        #ff0000 100%     /* Emergency */
    );
}
```

---

## 7. CSS Variables

```css
:root {
    /* Primary */
    --primary-bg: #0a0a1a;
    --primary-surface: #12121e;
    --primary-surface-hover: #1a1a2e;
    --primary-surface-active: #22223a;
    
    /* Accent */
    --accent-blue: #3b82f6;
    --accent-cyan: #06b6d4;
    --accent-purple: #8b5cf6;
    --accent-teal: #14b8a6;
    
    /* Status */
    --status-safe: #00ff88;
    --status-warning: #ffd700;
    --status-critical: #ff8c00;
    --status-emergency: #ff0000;
    --status-info: #60a5fa;
    
    /* Text */
    --text-primary: #ffffff;
    --text-secondary: #a0a0b0;
    --text-muted: #606070;
    --text-disabled: #404050;
    
    /* Border */
    --border-default: #2a2a3a;
    --border-active: #3b82f6;
    --border-success: #00ff88;
    --border-warning: #ffd700;
    --border-danger: #ff0000;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
    --shadow-glow-blue: 0 0 20px rgba(59, 130, 246, 0.3);
    --shadow-glow-green: 0 0 20px rgba(0, 255, 136, 0.3);
    --shadow-glow-red: 0 0 20px rgba(255, 0, 0, 0.3);
}
```

---

## 8. Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
    theme: {
        extend: {
            colors: {
                'space': {
                    '900': '#0a0a1a',
                    '800': '#12121e',
                    '700': '#1a1a2e',
                    '600': '#22223a',
                },
                'accent': {
                    'blue': '#3b82f6',
                    'cyan': '#06b6d4',
                    'purple': '#8b5cf6',
                    'teal': '#14b8a6',
                },
                'status': {
                    'safe': '#00ff88',
                    'warning': '#ffd700',
                    'critical': '#ff8c00',
                    'emergency': '#ff0000',
                }
            },
            boxShadow: {
                'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
                'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
                'glow-red': '0 0 20px rgba(255, 0, 0, 0.3)',
            }
        }
    }
}
```

---

## 9. Design Principles

### 9.1 Tesla-Inspired Elements
- **Minimalist layout** — Clean, uncluttered interface
- **Dark theme** — Reduced eye strain, professional look
- **Real-time data** — Live updates without page refresh
- **3D visualization** — Interactive, immersive experience
- **Monospace data** — Technical, engineering feel

### 9.2 Tata Technologies Elements
- **Industrial grade** — Robust, reliable appearance
- **Professional typography** — Clear hierarchy
- **Accessible design** — WCAG 2.1 compliance
- **Consistent spacing** — 8px grid system

---

*EdgeTwin-BMS+: Professional industrial design for mission-critical applications.*
