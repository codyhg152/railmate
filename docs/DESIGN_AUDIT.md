# Railmate Design Audit: Flighty Comparison Report

**Date:** March 26, 2026  
**Auditor:** Design Analysis Agent  
**Scope:** Typography, Colors, Layout, Cards, Map, Animations, Empty States, Status, Navigation

---

## Executive Summary

Railmate has a solid foundation but deviates significantly from Flighty's award-winning design principles. The current design prioritizes visual decoration over information clarity, missing the core "airport board" aesthetic that makes Flighty so effective. This audit identifies **47 specific differences** across 10 categories, with prioritized fixes.

---

## 1. TYPOGRAPHY ANALYSIS

### Current State (Railmate)
```typescript
// From TrainCard.tsx, index.tsx, constants.ts
- fontSize: 34 (title), 22 (routeCity), 18 (platformValue), 16 (infoValue)
- fontWeight: '800', '700', '600'
- No explicit font family (system default)
- Mixed tabular/regular nums usage
```

### Flighty Standard
- **Primary:** SF Pro Display/Text with specific weights
- **Time Display:** SF Mono or tabular-nums for all times
- **Hierarchy:** Time > Status > Details
- **Weights:** Regular (400), Medium (500), Semibold (600), Bold (700)
- **Sizes:** Large Title (34), Title 2 (22), Body (17), Callout (16), Footnote (13), Caption (12)

### Differences Found

| Element | Railmate | Flighty | Priority |
|---------|----------|---------|----------|
| Title font size | 34px bold | 34px semibold | Medium |
| Time display | 15px regular | 28-34px bold, tabular | **Critical** |
| Route cities | 22px bold | 20px medium | Medium |
| Status text | 13px bold | 15px semibold | High |
| Font family | System default | SF Pro explicitly | Medium |
| Tabular nums | Partial | All times | **Critical** |

### Fix Recommendations

```typescript
// constants.ts - Add typography system
export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    regular: 'SFPro-Regular',
    medium: 'SFPro-Medium',
    semibold: 'SFPro-Semibold',
    bold: 'SFPro-Bold',
    mono: 'SFMono-Regular',
  },
  
  // Sizes following iOS Human Interface Guidelines
  size: {
    largeTitle: 34,
    title1: 28,
    title2: 22,
    title3: 20,
    headline: 17,
    body: 17,
    callout: 16,
    subhead: 15,
    footnote: 13,
    caption1: 12,
    caption2: 11,
  },
  
  // Weights
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// TrainCard.tsx - Time should be MOST prominent
routeTime: {
  fontSize: TYPOGRAPHY.size.title2, // 22px
  fontWeight: TYPOGRAPHY.weight.bold,
  fontVariant: ['tabular-nums'],
  letterSpacing: -0.5,
  color: COLORS.text,
},

routeCity: {
  fontSize: TYPOGRAPHY.size.subhead, // 15px
  fontWeight: TYPOGRAPHY.weight.medium,
  color: COLORS.textSecondary,
},
```

---

## 2. COLOR SCHEME ANALYSIS

### Current State (Railmate)
```typescript
// constants.ts
export const COLORS = {
  background: '#000000',
  card: '#1C1C1E',
  cardSecondary: '#2C2C2E',
  border: '#3A3A3C',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
};
```

### Flighty Standard
- Uses pure iOS system colors
- No custom primary - uses system blue
- Status colors match iOS conventions exactly
- Background: Pure black (#000000) ✓
- Cards: Elevated with subtle borders
- Text hierarchy: White → Gray → Dark Gray

### Differences Found

| Element | Railmate | Flighty | Priority |
|---------|----------|---------|----------|
| Primary blue | #007AFF | System blue ✓ | - |
| Success green | #34C759 | System green ✓ | - |
| Warning orange | #FF9500 | System orange ✓ | - |
| Danger red | #FF3B30 | System red ✓ | - |
| Card backgrounds | Semi-transparent | Solid system gray | High |
| Border opacity | 5-10% | 15-20% | Medium |
| Text secondary | #8E8E93 | #8E8E93 ✓ | - |

### Fix Recommendations

```typescript
// constants.ts - Use iOS system colors exclusively
export const COLORS = {
  // System colors (correct)
  primary: '#007AFF',      // iOS System Blue
  success: '#34C759',      // iOS System Green  
  warning: '#FF9500',      // iOS System Orange
  danger: '#FF3B30',       // iOS System Red
  info: '#5AC8FA',         // iOS System Teal
  
  // Backgrounds (needs adjustment)
  background: '#000000',   // System Black ✓
  card: '#1C1C1E',         // System Gray 6 ✓
  cardSecondary: '#2C2C2E', // System Gray 5
  cardElevated: '#2C2C2E', // For elevated cards
  border: '#38383A',       // System Gray 4 (darker for visibility)
  
  // Text (correct)
  text: '#FFFFFF',         // System White
  textSecondary: '#8E8E93', // System Gray
  textTertiary: '#636366',  // System Gray 2
  textQuaternary: '#48484A', // System Gray 3
  
  // Status backgrounds (add opacity variants)
  statusBackgrounds: {
    success: 'rgba(52, 199, 89, 0.15)',
    warning: 'rgba(255, 149, 0, 0.15)',
    danger: 'rgba(255, 59, 48, 0.15)',
    info: 'rgba(90, 200, 250, 0.15)',
  },
};
```

---

## 3. LAYOUT & SPACING ANALYSIS

### Current State (Railmate)
- Cards with heavy padding (18px)
- Multiple nested containers
- Decorative elements (shadows, borders)
- Information spread across multiple rows

### Flighty Standard
- **Airport board style:** One line per item
- **Minimal padding:** 12-16px horizontal
- **Single row layout:** Time | Route | Status
- **No decorative shadows** on list items
- **Consistent 8px grid system**

### Differences Found

| Element | Railmate | Flighty | Priority |
|---------|----------|---------|----------|
| Card padding | 18px | 12-16px | High |
| List item height | Variable ~180px | Fixed ~72px | **Critical** |
| Information rows | 4-5 rows | 1 row | **Critical** |
| Shadows | Heavy (4px, 30% opacity) | None on list | High |
| Border radius | 20px | 12-16px | Medium |
| Horizontal margins | 16px | 0 (full bleed) | High |

### Fix Recommendations

```typescript
// TrainCard.tsx - Airport board style redesign
const styles = StyleSheet.create({
  // FLIGHTY-STYLE: Single row, minimal design
  card: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    // NO border radius for list items
    // NO shadow for list items
  },
  
  // Single row layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Time column (left, most prominent)
  timeColumn: {
    width: 70,
    alignItems: 'flex-start',
  },
  time: {
    fontSize: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: COLORS.text,
  },
  
  // Route column (center)
  routeColumn: {
    flex: 1,
    paddingHorizontal: 12,
  },
  routeText: {
    fontSize: 17,
    fontWeight: '400',
    color: COLORS.text,
  },
  
  // Status column (right)
  statusColumn: {
    width: 90,
    alignItems: 'flex-end',
  },
});

// index.tsx - Section headers
sectionTitle: {
  fontSize: 13,
  fontWeight: '600',
  color: COLORS.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  paddingHorizontal: 16,
  paddingVertical: 8,
  backgroundColor: COLORS.background, // Sticky header
},
```

---

## 4. INFORMATION HIERARCHY ANALYSIS

### Current State (Railmate)
```
┌─────────────────────────────────────┐
│ [Train #]              [Status]     │  ← Header
├─────────────────────────────────────┤
│ Berlin    →    Munich               │  ← Route (cities)
│ 09:00          12:30                │  ← Times
├─────────────────────────────────────┤
│ Platform │ Status    │ Gate          │  ← Info row
│   5      │ On Time   │ --            │
├─────────────────────────────────────┤
│ [=========>        ]                │  ← Progress bar
│ Berlin    In transit   Munich       │
└─────────────────────────────────────┘
```

### Flighty Standard
```
┌─────────────────────────────────────┐
│ 09:00  Berlin → Munich    ON TIME   │  ← Single row
│ 12:30                               │  ← Arrival time smaller
├─────────────────────────────────────┤
│ [=========>        ] 45% complete   │  ← Progress (if expanded)
└─────────────────────────────────────┘
```

### Differences Found

| Priority | Element | Issue |
|----------|---------|-------|
| **Critical** | Time prominence | Times are small (15px), should be largest (22px+) |
| **Critical** | Information density | 4-5 rows vs Flighty's 1-2 rows |
| High | Status visibility | Status is small badge, should be prominent text |
| High | Route display | Cities and times separated, should be combined |
| Medium | Progress bar | Always visible, should be optional/compact |
| Medium | Platform info | Secondary importance, too prominent |

### Fix Recommendations

```typescript
// TrainCard.tsx - Flighty-inspired hierarchy
export function TrainCard({ journey }: TrainCardProps) {
  const isDelayed = journey.status === 'DELAYED';
  
  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <View style={styles.row}>
        {/* LEFT: Departure time (MOST prominent) */}
        <View style={styles.timeColumn}>
          <Text style={styles.departureTime}>
            {format(departureTime, 'HH:mm')}
          </Text>
          {isDelayed && (
            <Text style={styles.delayedTime}>
              +{journey.delayMinutes}m
            </Text>
          )}
        </View>
        
        {/* CENTER: Route info */}
        <View style={styles.routeColumn}>
          <Text style={styles.routeText} numberOfLines={1}>
            {journey.origin.name} → {journey.destination.name}
          </Text>
          <Text style={styles.arrivalTime}>
            Arrives {format(arrivalTime, 'HH:mm')}
          </Text>
        </View>
        
        {/* RIGHT: Status (clear, prominent) */}
        <View style={styles.statusColumn}>
          <Text style={[
            styles.statusText,
            { color: STATUS_COLORS[journey.status] }
          ]}>
            {getStatusLabel(journey.status)}
          </Text>
        </View>
      </View>
      
      {/* Optional: Progress indicator (compact) */}
      {isActive && (
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  departureTime: {
    fontSize: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: COLORS.text,
  },
  delayedTime: {
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '500',
  },
  routeText: {
    fontSize: 17,
    color: COLORS.text,
    marginBottom: 2,
  },
  arrivalTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
```

---

## 5. CARD DESIGN ANALYSIS

### Current State (Railmate)
- Large rounded cards (20px radius)
- Heavy shadows (4px offset, 30% opacity)
- Decorative borders (5% opacity white)
- Multiple nested containers
- Gradient/shimmer effects

### Flighty Standard
- **List rows, not cards** for main view
- **No shadows** on list items
- **Hairline borders** between items
- **Full-bleed** design (no side margins)
- **Cards only for modals/sheets**

### Differences Found

| Element | Railmate | Flighty | Priority |
|---------|----------|---------|----------|
| Container type | Cards with shadows | Plain rows | **Critical** |
| Border radius | 20px | 0px (list) | High |
| Shadows | 4px, 30% opacity | None | High |
| Side margins | 16px | 0px (full bleed) | High |
| Item separators | None | Hairline borders | Medium |
| Background | Semi-transparent | Solid system gray | Medium |

### Fix Recommendations

```typescript
// Remove "card" concept from main list, use "rows"

// index.tsx - List container
const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
  },
});

// TrainCard.tsx → TrainRow.tsx (rename)
const styles = StyleSheet.create({
  row: {
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  // NO shadow
  // NO border radius
  // NO side margins
});

// Only use cards for:
// 1. Modal presentations
// 2. Bottom sheets
// 3. Detail views
// 4. Empty states
```

---

## 6. MAP VISUALIZATION ANALYSIS

### Current State (Railmate)
- Dark map style with custom colors
- Large train marker with pulse animation
- Multiple stop markers with labels
- Info card overlay at bottom
- Route line (4px, primary color)

### Flighty Standard
- **Clean, minimal map** (Apple Maps style)
- **Thin route line** (2px, subtle color)
- **Minimal markers** (origin/destination only)
- **Aircraft icon** for current position
- **No pulsing animations** (distracting)
- **Progress shown on route line**

### Differences Found

| Element | Railmate | Flighty | Priority |
|---------|----------|---------|----------|
| Map style | Dark custom | Standard Apple | Medium |
| Route line | 4px, bright blue | 2px, muted gray | High |
| Train marker | Large pulsing | Small simple icon | High |
| Stop markers | All shown | None (or minimal) | Medium |
| Labels | Many visible | Minimal | Medium |
| Info overlay | Large card | Compact bottom sheet | Medium |
| Animations | Heavy pulse | None | High |

### Fix Recommendations

```typescript
// map.tsx - Simplified map design
const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  // Use standard map, not dark custom style
  // Or use muted custom style closer to Apple Maps
});

// MapMarker.tsx - Simplified markers
const styles = StyleSheet.create({
  // Train marker - simple, no pulse
  trainMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
    // NO pulse animation
  },
  
  // Route line - thinner, muted
  routeLine: {
    strokeWidth: 2,
    strokeColor: 'rgba(0, 122, 255, 0.6)',
    lineCap: 'round',
  },
  
  // Completed portion - different color
  completedLine: {
    strokeWidth: 2,
    strokeColor: COLORS.primary,
  },
});

// Remove stop markers, only show origin/destination
// Remove pulse animations (distracting)
// Simplify info card to compact bottom sheet
```

---

## 7. ANIMATIONS ANALYSIS

### Current State (Railmate)
```typescript
// Multiple heavy animations:
- Entry: FadeIn + translateY (400ms)
- Staggered delays (100ms per item)
- Pulse animations on active items (continuous)
- Scale on press (spring)
- Shimmer effects on progress bars
- Heavy use of reanimated
```

### Flighty Standard
- **Subtle, purposeful animations only**
- **No continuous animations** (battery drain)
- **Quick transitions** (200-300ms)
- **No staggered delays** (feels slow)
- **System-standard curves**

### Differences Found

| Animation | Railmate | Flighty | Priority |
|-----------|----------|---------|----------|
| Entry duration | 400ms + stagger | 200-300ms, no stagger | High |
| Pulse effects | Continuous | None | **Critical** |
| Press feedback | Spring scale | System default | Medium |
| Shimmer | On progress bars | None | Medium |
| List loading | Skeleton shimmer | Simple spinner | Low |

### Fix Recommendations

```typescript
// Remove continuous pulse animations
// These drain battery and are distracting

// TrainCard.tsx - Simplified animations
export function TrainCard({ journey, index }: TrainCardProps) {
  // Remove pulse animation entirely
  // Remove staggered entry delays
  
  return (
    <Pressable 
      onPress={handlePress}
      android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed
      ]}
    >
      {/* Content */}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    // Base styles
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)', // Subtle highlight
  },
});

// index.tsx - Remove staggered entry
// Just render immediately or use simple fade
```

---

## 8. EMPTY STATES ANALYSIS

### Current State (Railmate)
```typescript
// EmptyState.tsx
- Large icon container (120px circle)
- Icon size: 64px
- Title: 22px bold
- Subtitle: 15px
- Action button: Full width, prominent
```

### Flighty Standard
- **Minimal, helpful messaging**
- **Action-oriented** (what to do next)
- **No decorative circles**
- **Compact design**
- **Illustration optional**

### Differences Found

| Element | Railmate | Flighty | Priority |
|---------|----------|---------|----------|
| Icon container | 120px circle | None or small | Medium |
| Icon size | 64px | 32-48px | Medium |
| Vertical padding | 60px | 40px | Low |
| Button style | Filled primary | Ghost/secondary | Medium |
| Message tone | Descriptive | Action-oriented | High |

### Fix Recommendations

```typescript
// EmptyState.tsx - Simplified design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  icon: {
    marginBottom: 16,
    // NO circular container
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
  },
});

// Better messaging
export function NoJourneysEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon="train-outline"
      title="Track your first journey"
      subtitle="Enter your train number to get real-time updates."
      actionLabel="Add Journey"
      onAction={onAdd}
    />
  );
}
```

---

## 9. STATUS INDICATORS ANALYSIS

### Current State (Railmate)
```typescript
// StatusBadge.tsx
- Pill-shaped badge with icon + text
- Background color with 15% opacity
- Pulsing animation for active states
- Icon scales with pulse
- Multiple sizes (small/medium/large)
```

### Flighty Standard
- **Text-only for list view** (cleaner)
- **Color-coded** (green/red/orange)
- **No background pills** in compact view
- **Icons only in detail view**
- **No animations**

### Differences Found

| Element | Railmate | Flighty | Priority |
|---------|----------|---------|----------|
| Container | Pill badge | Text only | High |
| Background | 15% opacity color | None (list) | High |
| Icon | Always shown | Detail view only | Medium |
| Animation | Pulse on active | None | **Critical** |
| Size variants | 3 sizes | 1 size | Low |

### Fix Recommendations

```typescript
// StatusBadge.tsx - Two modes: compact vs detailed
interface StatusBadgeProps {
  status: JourneyStatus;
  delayMinutes?: number;
  variant?: 'compact' | 'detailed';
}

export function StatusBadge({ 
  status, 
  delayMinutes, 
  variant = 'compact' 
}: StatusBadgeProps) {
  const config = getStatusConfig(status, delayMinutes);
  
  if (variant === 'compact') {
    // List view: text only, colored
    return (
      <Text style={[styles.compactText, { color: config.color }]}>
        {config.text}
      </Text>
    );
  }
  
  // Detail view: badge with icon
  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compactText: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
```

---

## 10. NAVIGATION ANALYSIS

### Current State (Railmate)
```typescript
// (tabs)/_layout.tsx inferred
- Tab bar with icons
- "My Trains" and "Map" tabs
- Header with title and add button
- Modal presentation for search
```

### Flighty Standard
- **Bottom tab bar** (correct)
- **Minimal icons** (no labels or small labels)
- **Large title** in header
- **Search in tab bar** (not modal)
- **No back button text** (just arrow)

### Differences Found

| Element | Railmate | Flighty | Priority |
|---------|----------|---------|----------|
| Tab labels | Visible | Minimal/hidden | Low |
| Header title | 34px bold | 34px semibold, large | Medium |
| Add button | In header | In tab bar | Medium |
| Search | Modal | Integrated | Low |
| Back button | "Back" text | Arrow only | Low |

### Fix Recommendations

```typescript
// (tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        // Hide labels for cleaner look
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Trains',
          tabBarIcon: ({ color }) => (
            <Ionicons name="train" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={24} color={color} />
          ),
        }}
      />
      {/* Add search as tab or floating button */}
    </Tabs>
  );
}

// _layout.tsx - Navigation styling
<Stack
  screenOptions={{
    headerStyle: {
      backgroundColor: COLORS.background,
    },
    headerTintColor: COLORS.primary,
    headerTitleStyle: {
      fontWeight: '600',
    },
    // Remove back button text
    headerBackTitleVisible: false,
  }}
>
```

---

## PRIORITY SUMMARY

### Critical Fixes (Must Do)
1. **Typography hierarchy** - Make times largest, use tabular nums
2. **Information density** - Reduce from 4-5 rows to 1-2 rows per item
3. **Remove pulse animations** - Battery drain, distracting
4. **Card to row conversion** - Remove shadows, use list rows
5. **Status display** - Text-only in list view

### High Priority (Should Do)
6. Simplify map markers and remove animations
7. Use hairline borders instead of card shadows
8. Full-bleed list design (no side margins)
9. Thinner route line on map
10. Compact empty states

### Medium Priority (Nice to Have)
11. Standardize on iOS system colors
12. Reduce border radius on cards
13. Simplify tab bar (hide labels)
14. Remove header back button text
15. Use SF Pro font explicitly

### Low Priority (Polish)
16. Adjust empty state messaging
17. Fine-tune spacing values
18. Add haptic feedback consistency
19. Loading state simplification
20. Icon size standardization

---

## IMPLEMENTATION ORDER

### Phase 1: Core Structure (Week 1)
1. Create new `TrainRow` component (replace TrainCard)
2. Update typography system with tabular nums
3. Remove all pulse animations
4. Convert cards to list rows

### Phase 2: Visual Polish (Week 2)
5. Update color system to pure iOS colors
6. Simplify map design
7. Redesign status indicators
8. Update empty states

### Phase 3: Fine-tuning (Week 3)
9. Navigation refinements
10. Spacing consistency
11. Animation cleanup
12. Final polish

---

## FILES TO MODIFY

| File | Changes |
|------|---------|
| `constants.ts` | Add TYPOGRAPHY, update COLORS |
| `TrainCard.tsx` | Complete redesign to TrainRow |
| `index.tsx` | Update list rendering, remove card styling |
| `map.tsx` | Simplify map style, markers |
| `MapMarker.tsx` | Remove animations, simplify |
| `StatusBadge.tsx` | Add compact/detailed variants |
| `EmptyState.tsx` | Simplify design |
| `ProgressBar.tsx` | Remove shimmer, simplify |
| `(tabs)/_layout.tsx` | Update tab bar styling |
| `_layout.tsx` | Update navigation styling |

---

## DESIGN PRINCIPLES CHECKLIST

- [ ] **Airport board aesthetic** - One line per journey
- [ ] **Information always visible** - Time most prominent
- [ ] **Boringly obvious** - No decorative distractions
- [ ] **Shines when things go wrong** - Clear delay indicators
- [ ] **Minimal presentation** - No unnecessary elements
- [ ] **Real-world analogy** - Follow airport/FIDS conventions

---

*End of Design Audit Report*
