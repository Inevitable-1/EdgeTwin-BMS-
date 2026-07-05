# Module Icons

## Icon Specifications for Every Module

---

## 1. Icon Library

**Recommended:** Lucide React (https://lucide.dev/)
**Alternative:** Heroicons, Phosphor Icons

---

## 2. Module Icons

### 2.1 Core Navigation

| Module | Icon Name | Lucide Import | Description |
|--------|-----------|---------------|-------------|
| Dashboard | LayoutDashboard | `LayoutDashboard` | Main overview |
| Digital Twin | Box | `Box` | 3D visualization |
| Battery Passport | BookOpen | `BookOpen` | Lifecycle data |
| Fleet Overview | Map | `Map` | Multi-vehicle view |
| Simulator | Play | `Play` | What-if analysis |
| Recommendations | Lightbulb | `Lightbulb` | AI suggestions |
| Alerts | Bell | `Bell` | Notification center |
| Settings | Settings | `Settings` | Configuration |

### 2.2 Battery Metrics

| Module | Icon Name | Lucide Import | Description |
|--------|-----------|---------------|-------------|
| Battery Health | Battery | `Battery` | SOH indicator |
| State of Charge | BatteryFull | `BatteryFull` | SOC indicator |
| Temperature | Thermometer | `Thermometer` | Temperature metric |
| Voltage | Zap | `Zap` | Voltage metric |
| Current | Activity | `Activity` | Current metric |
| Power | Power | `Power` | Power metric |
| Cycle Count | RefreshCw | `RefreshCw` | Cycle counter |
| Remaining Life | Clock | `Clock` | RUL indicator |

### 2.3 Risk and Alerts

| Module | Icon Name | Lucide Import | Description |
|--------|-----------|---------------|-------------|
| Safe | ShieldCheck | `ShieldCheck` | Safe status |
| Warning | AlertTriangle | `AlertTriangle` | Warning alert |
| Critical | AlertOctagon | `AlertOctagon` | Critical alert |
| Emergency | Siren | `Siren` | Emergency alert |
| Thermal Risk | Flame | `Flame` | Thermal indicator |
| Anomaly | SearchCode | `SearchCode` | Anomaly detected |

### 2.4 Actions

| Module | Icon Name | Lucide Import | Description |
|--------|-----------|---------------|-------------|
| Run Simulation | PlayCircle | `PlayCircle` | Start simulation |
| Stop | Square | `Square` | Stop simulation |
| Refresh | RotateCw | `RotateCw` | Refresh data |
| Download | Download | `Download` | Export data |
| Upload | Upload | `Upload` | Import data |
| Share | Share2 | `Share2` | Share data |
| Export | FileDown | `FileDown` | Export report |
| Print | Printer | `Printer` | Print report |

### 2.5 Navigation

| Module | Icon Name | Lucide Import | Description |
|--------|-----------|---------------|-------------|
| Home | Home | `Home` | Home page |
| Back | ArrowLeft | `ArrowLeft` | Go back |
| Forward | ArrowRight | `ArrowRight` | Go forward |
| Menu | Menu | `Menu` | Mobile menu |
| Close | X | `X` | Close dialog |
| Search | Search | `Search` | Search function |
| Filter | Filter | `Filter` | Filter data |
| Sort | ArrowUpDown | `ArrowUpDown` | Sort data |

### 2.6 Data Visualization

| Module | Icon Name | Lucide Import | Description |
|--------|-----------|---------------|-------------|
| Line Chart | TrendingUp | `TrendingUp` | Line graph |
| Bar Chart | BarChart3 | `BarChart3` | Bar graph |
| Pie Chart | PieChart | `PieChart` | Pie chart |
| Scatter Plot | ScatterChart | `ScatterChart` | Scatter plot |
| Heatmap | Grid3x3 | `Grid3x3` | Heatmap view |
| 3D View | Box | `Box` | 3D visualization |

### 2.7 System

| Module | Icon Name | Lucide Import | Description |
|--------|-----------|---------------|-------------|
| User | User | `User` | User profile |
| Logout | LogOut | `LogOut` | Sign out |
| Lock | Lock | `Lock` | Secure |
| Unlock | Unlock | `Unlock` | Unlocked |
| Eye | Eye | `Eye` | View visible |
| Eye Off | EyeOff | `EyeOff` | View hidden |
| Check | Check | `Check` | Confirmed |
| X | X | `X` | Cancelled |

---

## 3. Icon Sizes

| Context | Size | Stroke Width |
|---------|------|--------------|
| Navigation | 24px | 2px |
| Dashboard Cards | 20px | 2px |
| Status Indicators | 16px | 2px |
| Buttons | 18px | 2px |
| Mobile Navigation | 28px | 2px |

---

## 4. Icon Colors

| Status | Color | Hex |
|--------|-------|-----|
| Default | Text Secondary | `#a0a0b0` |
| Active | Electric Blue | `#3b82f6` |
| Safe | Safe Green | `#00ff88` |
| Warning | Warning Yellow | `#ffd700` |
| Critical | Critical Orange | `#ff8c00` |
| Emergency | Emergency Red | `#ff0000` |

---

## 5. Icon Usage Examples

```tsx
import { Battery, Thermometer, Zap, AlertTriangle } from 'lucide-react';

// Battery Health Card
const BatteryHealthCard = () => (
    <div className="bg-[#12121e] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
            <Battery className="w-5 h-5 text-[#00ff88]" />
            <span className="text-white font-semibold">Battery Health</span>
        </div>
        <div className="text-3xl font-bold text-[#00ff88]">87.3%</div>
    </div>
);

// Temperature Alert
const TemperatureAlert = ({ temperature }) => (
    <div className="flex items-center gap-2">
        <Thermometer className="w-5 h-5 text-[#ff8c00]" />
        <span className="text-[#ff8c00]">{temperature}°C</span>
        <AlertTriangle className="w-4 h-4 text-[#ffd700]" />
    </div>
);

// Voltage Indicator
const VoltageIndicator = ({ voltage }) => (
    <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-[#ffd700]" />
        <span className="text-[#ffd700]">{voltage}V</span>
    </div>
);
```

---

## 6. Custom Icons (Optional)

For battery-specific icons not available in Lucide:

```svg
<!-- Battery Cell Icon -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="6" y="4" width="12" height="16" rx="2" />
    <rect x="9" y="2" width="6" height="2" rx="1" />
    <line x1="12" y1="8" x2="12" y2="16" />
</svg>

<!-- Thermal Runaway Icon -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
</svg>

<!-- Digital Twin Icon -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
</svg>
```

---

*EdgeTwin-BMS+: Consistent, professional iconography throughout.*
