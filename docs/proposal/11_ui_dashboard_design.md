# UI Dashboard Design

## Professional Industrial Dashboard Specification

---

## 1. Design System

### 1.1 Color Palette (Tesla/Tata Inspired)

```css
:root {
    /* Primary Colors */
    --primary-bg: #0a0a1a;           /* Deep space black */
    --primary-surface: #12121e;       /* Card background */
    --primary-surface-hover: #1a1a2e; /* Card hover */
    
    /* Accent Colors */
    --accent-blue: #3b82f6;           /* Primary actions */
    --accent-cyan: #06b6d4;           /* Data visualization */
    --accent-purple: #8b5cf6;         /* Predictions */
    
    /* Status Colors */
    --status-safe: #00ff88;           /* Green - safe */
    --status-warning: #ffd700;        /* Yellow - warning */
    --status-critical: #ff8c00;       /* Orange - critical */
    --status-emergency: #ff0000;      /* Red - emergency */
    
    /* Text Colors */
    --text-primary: #ffffff;          /* Headings */
    --text-secondary: #a0a0b0;        /* Body text */
    --text-muted: #606070;            /* Labels */
    
    /* Border Colors */
    --border-default: #2a2a3a;        /* Default border */
    --border-active: #3b82f6;         /* Active/focus border */
}
```

### 1.2 Typography

```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
```

### 1.3 Spacing System

```css
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
```

---

## 2. Dashboard Layout

### 2.1 Main Dashboard Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────┐  EdgeTwin-BMS+ Dashboard                    [⚙] [🔔]│
│  │ LOGO │  ─────────────────────────────────────────────────────│
│  └──────┘                                                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────┐                                                     │
│  │Dash-   │  ┌─────────────────────────────────────────────┐   │
│  │board   │  │                                             │   │
│  │        │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│  │Digital │  │  │ SOH     │ │ SOC     │ │ RUL     │      │   │
│  │Twin    │  │  │ 87.3%   │ │ 62.4%   │ │ 847     │      │   │
│  │        │  │  │ ▲ +0.2% │ │ ▼ -1.3% │ │ cycles  │      │   │
│  │Passport│  │  └─────────┘ └─────────┘ └─────────┘      │   │
│  │        │  │                                             │   │
│  │Fleet   │  │  ┌─────────────────┐ ┌─────────────────┐  │   │
│  │        │  │  │  Temperature    │ │  Voltage Graph  │  │   │
│  │Simulat-│  │  │  Graph          │ │                 │  │   │
│  │or      │  │  │  📈             │ │  📈             │  │   │
│  │        │  │  └─────────────────┘ └─────────────────┘  │   │
│  │Recomm- │  │                                             │   │
│  │endat-  │  │  ┌─────────────────┐ ┌─────────────────┐  │   │
│  │ions    │  │  │  Risk Meter     │ │  Alerts Panel   │  │   │
│  │        │  │  │  🎯             │ │  ⚠️ 2 Critical  │  │   │
│  │Alerts  │  │  └─────────────────┘ └─────────────────┘  │   │
│  │        │  │                                             │   │
│  └────────┘  │  ┌─────────────────────────────────────┐  │   │
│              │  │  Recommendation Panel                │  │   │
│              │  │  💡 "Reduce fast charging frequency" │  │   │
│              │  └─────────────────────────────────────┘  │   │
│              └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Navigation Structure

| Menu Item | Icon | Description |
|-----------|------|-------------|
| Dashboard | Grid | Main overview |
| Digital Twin | Box | 3D visualization |
| Battery Passport | Book | Lifecycle data |
| Fleet Overview | Map | Multi-vehicle view |
| Simulator | Play | What-if analysis |
| Recommendations | Lightbulb | AI suggestions |
| Alerts | Bell | Notification center |
| Settings | Gear | Configuration |

---

## 3. Component Specifications

### 3.1 Battery Health Card

```
┌─────────────────────────────────────┐
│  BATTERY HEALTH                     │
│  ─────────────────────────────────  │
│                                     │
│         ┌─────────────┐            │
│         │             │            │
│         │    87.3%    │            │
│         │    SOH      │            │
│         │             │            │
│         └─────────────┘            │
│                                     │
│  ▲ +0.2% from last week            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 100% │         ╭────╮      │   │
│  │      │      ╭──╯    ╰──╮  │   │
│  │  75% │   ╭──╯          ╰──│   │
│  │      │╭──╯                │   │
│  │  50% │╯                   │   │
│  │      └────────────────────│   │
│  │  0%  100  200  300  400   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Predicted EOL: 847 cycles         │
│  Days Remaining: ~2.3 years        │
│                                     │
└─────────────────────────────────────┘
```

### 3.2 Temperature Graph

```typescript
const TemperatureGraph: React.FC<{ data: TemperatureData }> = ({ data }) => {
    return (
        <div className="bg-[#12121e] rounded-lg p-4 border border-[#2a2a3a]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Temperature Monitor</h3>
                <div className="flex gap-4 text-sm">
                    <span className="text-[#00ff88]">● Avg: {data.average}°C</span>
                    <span className="text-[#ff8c00]">● Max: {data.maximum}°C</span>
                    <span className="text-[#3b82f6]">● Min: {data.minimum}°C</span>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.history}>
                    <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff8c00" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ff8c00" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                    <XAxis dataKey="time" stroke="#606070" />
                    <YAxis stroke="#606070" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3a' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#ff8c00" 
                        fillOpacity={1} 
                        fill="url(#tempGradient)" 
                    />
                    <ReferenceLine y={45} stroke="#ffd700" strokeDasharray="3 3" />
                    <ReferenceLine y={55} stroke="#ff0000" strokeDasharray="3 3" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
```

### 3.3 Risk Meter

```
┌─────────────────────────────────────┐
│  THERMAL RISK ASSESSMENT            │
│  ─────────────────────────────────  │
│                                     │
│         ┌─────────────┐            │
│         │  ╭───────╮  │            │
│         │ ╱         ╲ │            │
│         ││     ●     ││            │
│         ││    32%    ││            │
│         │ ╲         ╱ │            │
│         │  ╰───────╯  │            │
│         └─────────────┘            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ SAFE   WARNING  CRITICAL   │   │
│  │  0-30   31-60    61-100    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Status: SAFE                       │
│  Last Updated: 2 seconds ago        │
│                                     │
│  Contributing Factors:              │
│  • Temperature: +12%                │
│  • Voltage Deviation: +8%           │
│  • Cycle Count: +5%                 │
│                                     │
└─────────────────────────────────────┘
```

### 3.4 Battery Passport View

```
┌─────────────────────────────────────────────────────────────────┐
│  BATTERY PASSPORT - BT-2024-001                                 │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BASIC INFORMATION                                       │   │
│  │  Battery ID:     BT-2024-001                            │   │
│  │  Manufacturer:   Tata Autocomp                          │   │
│  │  Chemistry:      NMC 811                                │   │
│  │  Capacity:       75.0 kWh                               │   │
│  │  Nominal Voltage: 355.2V                                │   │
│  │  Manufacturing:  2024-01-15                             │   │
│  │  Warranty:       8 years / 160,000 km                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  HEALTH STATUS                                           │   │
│  │  Current SOH:    87.3% ████████████░░░░ 87%             │   │
│  │  Cycle Count:    1,247 / 5,000                          │   │
│  │  RUL:            847 cycles (~2.3 years)                │   │
│  │  Status:         ACTIVE                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CHARGING HISTORY                                        │   │
│  │  Total Sessions:     892                                │   │
│  │  Fast Charges:       234 (26.2%)                        │   │
│  │  Avg Charge Time:    45 min                             │   │
│  │  Avg Energy/Session: 22.3 kWh                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SUSTAINABILITY                                          │   │
│  │  Carbon Footprint:    12,450 kg CO2e                    │   │
│  │  Renewable Energy:    34%                                │   │
│  │  Second-Life Ready:   YES                                │   │
│  │  Recycling Status:    NOT ELIGIBLE                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MAINTENANCE RECORD                                      │   │
│  │  ┌────────┬──────────────────┬──────────┬─────────┐    │   │
│  │  │ Date   │ Type             │ Cost     │ Status  │    │   │
│  │  ├────────┼──────────────────┼──────────┼─────────┤    │   │
│  │  │ 2024-06│ Inspection       │ ₹2,000   │ Done    │    │   │
│  │  │ 2024-12│ Balancing        │ ₹500     │ Done    │    │   │
│  │  │ 2025-03│ Thermal Service  │ ₹5,000   │ Done    │    │   │
│  │  └────────┴──────────────────┴──────────┴─────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Fleet Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  FLEET OVERVIEW - 24 Vehicles                                    │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FLEET SUMMARY                                           │   │
│  │  Total Vehicles:  24  │  Active:  22  │  Maintenance: 2  │   │
│  │  Avg SOH: 82.4%      │  Min SOH: 61.2% │  Max SOH: 98.1%│   │
│  │  Alerts: 3 Critical  │  5 Warnings     │  16 Normal      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  VEHICLE LIST                                            │   │
│  │  ┌────┬──────────┬──────┬──────┬──────┬─────────────┐  │   │
│  │  │ ID │ Vehicle  │ SOH  │ Temp │ Risk │ Status      │  │   │
│  │  ├────┼──────────┼──────┼──────┼──────┼─────────────┤  │   │
│  │  │ 01 │ EV-001   │ 92%  │ 28°C │ 12%  │ ✅ Normal   │  │   │
│  │  │ 02 │ EV-002   │ 85%  │ 31°C │ 28%  │ ✅ Normal   │  │   │
│  │  │ 03 │ EV-003   │ 78%  │ 35°C │ 45%  │ ⚠️ Warning  │  │   │
│  │  │ 04 │ EV-004   │ 61%  │ 42°C │ 72%  │ 🔴 Critical │  │   │
│  │  │ 05 │ EV-005   │ 94%  │ 26°C │ 8%   │ ✅ Normal   │  │   │
│  │  └────┴──────────┴──────┴──────┴──────┴─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FLEET HEALTH DISTRIBUTION                               │   │
│  │  [████████████████████░░░░░░░░░░] 70%  SOH > 80%        │   │
│  │  [████████░░░░░░░░░░░░░░░░░░░░░░] 25%  SOH 60-80%       │   │
│  │  [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  5%  SOH < 60%        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Battery Life Simulator

### 4.1 Simulator Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  BATTERY LIFE SIMULATOR                                         │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  INPUT PARAMETERS                                        │   │
│  │                                                          │   │
│  │  Driving Style:     [Eco ▼]                             │   │
│  │                      ● Eco                               │   │
│  │                      ○ Normal                            │   │
│  │                      ○ Sport                             │   │
│  │                                                          │   │
│  │  Charging Pattern:  [Slow (AC) ▼]                       │   │
│  │                      ● Slow (AC ≤ 7kW)                  │   │
│  │                      ○ Fast (DC ≤ 50kW)                 │   │
│  │                      ○ Rapid (DC ≤ 150kW)               │   │
│  │                                                          │   │
│  │  Daily Distance:    [═══════════●═══] 60 km             │   │
│  │                                                          │   │
│  │  Ambient Temp:      [═══════●═══════] 25°C              │   │
│  │                                                          │   │
│  │  Charge to:         [═══════════●═══] 80%               │   │
│  │                                                          │   │
│  │  [▶ RUN SIMULATION]                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SIMULATION RESULTS                                      │   │
│  │                                                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ Battery Life│ │ Thermal Risk│ │ Efficiency   │      │   │
│  │  │  8.2 years  │ │   18%       │ │   94.2%      │      │   │
│  │  │  2,460 cyc  │ │   LOW       │ │              │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  │                                                          │   │
│  │  Predicted Degradation Curve:                           │   │
│  │  100%│╲                                                │   │
│  │      │ ╲                                               │   │
│  │   80%│  ╲                                              │   │
│  │      │   ╲                                             │   │
│  │   60%│    ╲                                            │   │
│  │      │     ╲                                           │   │
│  │   40%│      ╲────── EOL (40% SOH)                     │   │
│  │      └─────────────────────────────                   │   │
│  │      0   2   4   6   8   10  years                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RECOMMENDATIONS                                         │   │
│  │  💡 Switch to normal driving for +0.8 years             │   │
│  │  💡 Reduce daily distance by 10km for +1.2 years       │   │
│  │  💡 Avoid fast charging for +0.5 years                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Responsive Design

### 5.1 Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, stacked cards |
| Tablet | 640-1024px | Two column layout |
| Desktop | 1024-1440px | Full sidebar + content |
| Wide | > 1440px | Expanded content area |

### 5.2 Mobile Adaptations

- Sidebar collapses to bottom navigation
- Cards stack vertically
- 3D twin uses touch gestures
- Graphs resize to full width
- Passport shows summary view with expand option

---

*EdgeTwin-BMS+: Industrial-grade UI for mission-critical battery intelligence.*
