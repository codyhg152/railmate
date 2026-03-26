# Railmate - UI/UX Design System & Wireframes

## Design Philosophy

> **"Boringly obvious. Airport signage clarity. Always visible."**

Following Flighty's award-winning approach: the interface should feel so natural that users don't think about it. Information hierarchy follows decades-tested airport departure board conventions.

---

## 1. Design Principles

### 1.1 Information Hierarchy
1. **Time** - Most critical (when is my train?)
2. **Status** - Is it on time? Delayed? Cancelled?
3. **Destination** - Where is it going?
4. **Platform** - Where do I go?
5. **Details** - Train type, amenities, etc.

### 1.2 Typography Scale
```
Display:     48px / 600 weight - Large countdown timers
Headline:    32px / 600 weight - Section headers
Title:       24px / 600 weight - Card titles
Body Large:  18px / 400 weight - Primary content
Body:        16px / 400 weight - Secondary content
Caption:     14px / 500 weight - Labels, timestamps
Small:       12px / 500 weight - Metadata, badges
```

**Font Family:** SF Pro Display (iOS), Inter (Android/Web)

### 1.3 Color System

#### Semantic Colors
```css
/* Status Colors */
--status-ontime: #34C759;        /* Green - On time */
--status-delayed: #FF9500;       /* Orange - Delayed < 15min */
--status-heavily-delayed: #FF3B30; /* Red - Delayed > 15min */
--status-cancelled: #8E8E93;     /* Gray - Cancelled */
--status-boarding: #007AFF;      /* Blue - Boarding now */

/* Brand Colors */
--brand-primary: #007AFF;        /* iOS Blue */
--brand-secondary: #5856D6;      /* Purple accent */
--brand-accent: #FF2D55;         /* Pink for highlights */

/* Background Colors */
--bg-primary: #000000;           /* Pure black (OLED) */
--bg-secondary: #1C1C1E;         /* Elevated surfaces */
--bg-tertiary: #2C2C2E;          /* Input fields, cards */

/* Text Colors */
--text-primary: #FFFFFF;         /* Primary text */
--text-secondary: #8E8E93;       /* Secondary text */
--text-tertiary: #48484A;        /* Disabled, placeholders */
```

#### Dark Mode (Default)
The app uses dark mode as default - easier on the eyes in stations, better for OLED displays, and follows modern iOS conventions.

### 1.4 Spacing Scale
```
4px   - xs (tight spacing)
8px   - sm (icon padding)
12px  - md (card padding)
16px  - lg (section gaps)
20px  - xl (screen padding)
24px  - 2xl (major sections)
32px  - 3xl (hero spacing)
48px  - 4xl (section breaks)
```

### 1.5 Border Radius
```
8px   - Small buttons, badges
12px  - Input fields
16px  - Cards
24px  - Large cards, modals
32px  - Full rounded (pills)
```

---

## 2. Core Screens

### 2.1 Home / My Trains (Main Screen)

**Purpose:** Show all tracked journeys at a glance

**Layout:**
```
┌─────────────────────────────────────┐
│  Railmate                [+] [👤]   │  ← Header
├─────────────────────────────────────┤
│                                     │
│  TODAY                              │  ← Section header
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🚄 ICE 123                    │  │  ← Train card
│  │                               │  │
│  │ 14:35      On Time      5     │  │  ← Time | Status | Platform
│  │ Berlin → Munich               │  │  ← Route
│  │                               │  │
│  │ [▓▓▓▓▓▓░░░░░░░░] 45 min left │  │  ← Progress bar
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🚅 TGV 9876                   │  │
│  │                               │  │
│  │ 16:20    +5 min late     12   │  │  ← Delay shown in orange
│  │ Paris → Lyon                  │  │
│  │                               │  │
│  │ ⚠️ Signal failure ahead       │  │  ← Delay reason
│  └───────────────────────────────┘  │
│                                     │
│  UPCOMING                           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🚂 RE 4567                    │  │
│  │                               │  │
│  │ Tomorrow 08:30                │  │
│  │ Hamburg → Berlin              │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Interactions:**
- Tap card → Journey detail
- Swipe left → Delete/archive
- Pull down → Refresh
- Long press → Quick actions (share, add to calendar)

---

### 2.2 Journey Detail Screen

**Purpose:** Comprehensive view of a single journey

**Layout:**
```
┌─────────────────────────────────────┐
│  ←           Journey        [Share] │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │     🚄 ICE 123                │  │  ← Train number
│  │                               │  │
│  │   14:35  ───────►  19:15      │  │  ← Timeline
│  │   BER              MUC        │  │
│  │                               │  │
│  │   On time • Platform 5        │  │  ← Status
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  LIVE PROGRESS                      │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │    Berlin Hbf        ●───────│  │  ← Current position
│  │    14:35 ✓                    │  │
│  │         │                     │  │
│  │    Hannover Hbf      ●───────│  │
│  │    16:20 (expected)           │  │
│  │         │                     │  │
│  │    Munich Hbf        ○       │  │
│  │    19:15                      │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  DELAY PREDICTION                   │
│  ┌───────────────────────────────┐  │
│  │  🔮 98% on-time history       │  │
│  │  Based on last 30 days        │  │
│  └───────────────────────────────┘  │
│                                     │
│  CONNECTIONS                        │
│  ┌───────────────────────────────┐  │
│  │  🚇 S-Bahn S8 to City Center  │  │
│  │  Platform 2 • 3 min walk      │  │
│  └───────────────────────────────┘  │
│                                     │
│  [🎫 Add to Wallet] [📤 Share]      │
│                                     │
└─────────────────────────────────────┘
```

**Sections:**
1. **Hero Card** - Train number, times, status
2. **Live Progress** - Visual journey map with current position
3. **Delay Prediction** - ML-powered forecast
4. **Stops** - All intermediate stations
5. **Connections** - Transfer options at destination
6. **Amenities** - WiFi, restaurant, quiet zone
7. **Actions** - Add to calendar, share, ticket

---

### 2.3 Search / Add Journey

**Purpose:** Find and add trains to track

**Layout:**
```
┌─────────────────────────────────────┐
│  ←         Add Journey              │
├─────────────────────────────────────┤
│                                     │
│  FROM                               │
│  ┌───────────────────────────────┐  │
│  │ 📍 Berlin Hbf            [X]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  TO                                 │
│  ┌───────────────────────────────┐  │
│  │ 📍 Munich Hbf            [X]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  WHEN                    PASSENGERS │
│  ┌──────────┐            ┌────────┐ │
│  │ Today ▼  │            │ 1 ▼    │ │
│  └──────────┘            └────────┘ │
│                                     │
│  [        Search Trains         ]   │
│                                     │
│  RESULTS                            │
│  ┌───────────────────────────────┐  │
│  │ 🚄 ICE 123        14:35-19:15 │  │
│  │ Direct • 4h 40m      €89.90   │  │
│  │ [+ Track This Train]          │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🚂 IC 456         15:20-21:00 │  │
│  │ 1 change • 5h 40m    €49.90   │  │
│  │ [+ Track This Train]          │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

### 2.4 Station Board

**Purpose:** Live departure board for any station

**Layout:**
```
┌─────────────────────────────────────┐
│  ←    Berlin Hbf             [🔍]   │
├─────────────────────────────────────┤
│  Departures  |  Arrivals  |  Info   │  ← Tab switcher
├─────────────────────────────────────┤
│  Time  Train      Destination  Plat │  ← Header row
├─────────────────────────────────────┤
│                                     │
│  14:35 ICE 123  Munich         5    │  ← On time
│     ✓                               │
│                                     │
│  14:42 RE 456   Potsdam        3    │  ← On time
│     ✓                               │
│                                     │
│  14:50 ICE 789  Hamburg   +10m  8   │  ← Delayed (orange)
│     ⚠️ Signal failure               │
│                                     │
│  15:00 IC 234   Dresden        12   │  ← Cancelled (gray)
│     ✗ Cancelled                     │
│                                     │
│  15:05 TGV 987  Paris          1    │  ← Boarding (blue)
│     🔔 Now Boarding                 │
│                                     │
└─────────────────────────────────────┘
```

**Design Notes:**
- One row per train (airport board style)
- Status icons on left (✓ ✗ ⚠️ 🔔)
- Delay shown inline with time
- Platform right-aligned
- Swipe for more options

---

### 2.5 Live Activity / Dynamic Island

**Purpose:** Always-visible journey status

**Compact (Dynamic Island):**
```
┌─────────────────────────────────────┐
│                                     │
│      🚄 ICE 123    14:35    5       │
│      [▓▓▓▓▓▓░░░░]  28 min           │
│                                     │
└─────────────────────────────────────┘
```

**Expanded (Lock Screen):**
```
┌─────────────────────────────────────┐
│                                     │
│  🚄 ICE 123                         │
│  Berlin → Munich                    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 14:35  [▓▓▓▓▓▓░░░░░░]  19:15 │  │
│  │        28 min remaining       │  │
│  └───────────────────────────────┘  │
│                                     │
│  Platform 5 • On time               │
│                                     │
└─────────────────────────────────────┘
```

---

### 2.6 Railmate Passport (Stats)

**Purpose:** Personal travel history and achievements

**Layout:**
```
┌─────────────────────────────────────┐
│  ←        Your Passport             │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │     🏆 47,392 km              │  │  ← Total distance
│  │     127 journeys this year    │  │
│  │                               │  │
│  │  [🗺️ View Your Map]          │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ACHIEVEMENTS                       │
│  ┌───────────────────────────────┐  │
│  │ 🥇 ICE Master      25+ ICE    │  │
│  │ 🥈 Early Bird      20+ before │  │
│  │ 🥉 Euro Traveler   5+ countries│  │
│  └───────────────────────────────┘  │
│                                     │
│  TOP STATIONS                       │
│  1. Berlin Hbf        42 visits     │
│  2. Munich Hbf        28 visits     │
│  3. Frankfurt Hbf     15 visits     │
│                                     │
│  FAVORITE ROUTES                    │
│  Berlin ↔ Munich      12 times      │
│  Paris ↔ Lyon          8 times      │
│                                     │
└─────────────────────────────────────┘
```

---

### 2.7 Widgets

**Home Screen Widget (Small):**
```
┌──────────┐
│ 🚄 ICE   │
│ 123      │
│          │
│ 14:35    │
│ Plat 5   │
└──────────┘
```

**Home Screen Widget (Medium):**
```
┌──────────────────┐
│ 🚄 ICE 123       │
│ Berlin → Munich  │
│                  │
│ 14:35    Plat 5  │
│ On time          │
└──────────────────┘
```

**Lock Screen Widget:**
```
┌──────────────────┐
│ 🚄 14:35  Plat 5 │
│ ICE 123          │
└──────────────────┘
```

---

## 3. Component Library

### 3.1 Train Card
```
┌─────────────────────────────────────┐
│ [Icon] Train Number          [Type] │
│                                     │
│ Time        Status         Platform │
│ Route                               │
│                                     │
│ [Progress/Info/Warning]             │
└─────────────────────────────────────┘
```

**States:**
- Default
- Delayed (orange border)
- Cancelled (grayed out)
- Boarding (pulsing blue border)

### 3.2 Status Badge
```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
|  On Time │  | +5 min  │  |Cancelled│  |Boarding │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
  Green       Orange       Gray         Blue
```

### 3.3 Station Row
```
┌─────────────────────────────────────┐
│ [Time] [Train] [Destination] [Plat] │
│ [Status indicator]                  │
└─────────────────────────────────────┘
```

### 3.4 Progress Bar
```
On Time:     [▓▓▓▓▓▓▓▓░░░░░░░░] 50%
Delayed:     [▓▓▓▓▓▓░░░░░░░░░░] +10m
Completed:   [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] ✓
```

---

## 4. Interactions & Animations

### 4.1 Micro-interactions

**Pull to Refresh:**
- Train icon animates
- Track "moves" under train
- Haptic feedback on release

**Delay Update:**
- Number counts up/down
- Color transitions smoothly
- Subtle pulse animation

**Platform Change:**
- Old platform fades out
- New platform slides in
- Alert notification

**Train Arrival:**
- Progress bar fills
- Checkmark animates
- Confetti for on-time arrival

### 4.2 Page Transitions

**Card to Detail:**
- Shared element transition
- Card expands to fill screen
- Content fades in

**Back Navigation:**
- Detail shrinks to card
- Smooth spring animation

### 4.3 Haptic Feedback

| Action | Feedback |
|--------|----------|
| Add journey | Light impact |
| Delay alert | Notification |
| Platform change | Warning |
| Train arrives | Success |
| Pull refresh | Selection |

---

## 5. Empty & Error States

### 5.1 No Trains Tracked
```
┌─────────────────────────────────────┐
│                                     │
│         🚂                          │
│                                     │
│    No journeys yet                  │
│                                     │
│    Track your first train to        │
│    get real-time updates            │
│                                     │
│    [+ Add Journey]                  │
│                                     │
└─────────────────────────────────────┘
```

### 5.2 Search No Results
```
┌─────────────────────────────────────┐
│                                     │
│         🔍                          │
│                                     │
│    No trains found                  │
│                                     │
│    Try different stations or        │
│    check your date                  │
│                                     │
└─────────────────────────────────────┘
```

### 5.3 Network Error
```
┌─────────────────────────────────────┐
│                                     │
│         📡                          │
│                                     │
│    Can't connect                    │
│                                     │
│    Check your connection and        │
│    try again                        │
│                                     │
│    [Retry]                          │
│                                     │
└─────────────────────────────────────┘
```

### 5.4 Station Closed
```
┌─────────────────────────────────────┐
│                                     │
│         🚧                          │
│                                     │
│    Station information              │
│    temporarily unavailable          │
│                                     │
│    Showing cached data from         │
│    10 minutes ago                   │
│                                     │
└─────────────────────────────────────┘
```

---

## 6. Accessibility

### 6.1 VoiceOver Support
- All train cards read as: "ICE 123 to Munich, departing 2:35 PM from platform 5, on time"
- Delay announcements: "Delayed 5 minutes, new departure 2:40 PM"
- Platform changes: "Alert, platform changed to 7"

### 6.2 Dynamic Type
- Support all iOS text sizes
- Layout adapts gracefully
- Minimum 11pt for all text

### 6.3 Color Contrast
- All text meets WCAG AA (4.5:1)
- Status colors have text labels
- Don't rely on color alone

### 6.4 Reduce Motion
- Respect system setting
- Disable non-essential animations
- Keep functional animations (progress)

---

## 7. Responsive Considerations

### 7.1 iPhone SE (Small)
- Compact train cards
- Single column layout
- Reduced padding

### 7.2 iPhone Pro Max (Large)
- Larger touch targets
- More content visible
- Split view where appropriate

### 7.3 iPad
- Sidebar navigation
- Master-detail layout
- More stats visible

---

## 8. Iconography

### 8.1 Train Type Icons
```
🚄 - High speed (ICE, TGV, Frecciarossa)
🚅 - Express (IC, EuroCity)
🚂 - Regional (RE, RB, TER)
🚇 - Urban (S-Bahn, Metro)
🚃 - Tram/Local
```

### 8.2 Status Icons
```
✓ - On time
⚠️ - Delayed
✗ - Cancelled
🔔 - Boarding
🕐 - Scheduled
📍 - Current location
```

### 8.3 Amenity Icons
```
📶 - WiFi
🍽️ - Restaurant
🔇 - Quiet zone
♿ - Accessible
🚲 - Bicycle
🐕 - Pet friendly
```

---

*Document Version: 1.0*
*Last Updated: March 2026*
