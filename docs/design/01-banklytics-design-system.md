# Banklytics Design System & Token Specifications

## 1. Project Overview & Stitch Reference
- **Project Title**: Banklytics — Premium Fintech Platform
- **Stitch Project ID**: `7313952009283239094`
- **Design System Asset**: `assets/2651316372373583286`
- **Stitch Project URL**: [https://stitch.withgoogle.com/projects/7313952009283239094](https://stitch.withgoogle.com/projects/7313952009283239094)
- **Design Aesthetic**: Apple Human Interface Guidelines meets Linear-grade dark UI precision.

---

## 2. Color System Tokens

### 2.1 Primary Palette — Ink Navy
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `color-navy-base` | `#101827` | Canvas background, deep foundation |
| `color-navy-card` | `#172338` | Primary card surfaces, modals |
| `color-navy-elevated`| `#202F45` | Elevated items, table headers, hover surfaces |
| `color-navy-border` | `#25364D` | Subtle 1px structural borders & dividers |

### 2.2 Secondary Palette — Pearl White
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `color-pearl-white` | `#F7F5F0` | Primary headings, prominent numerical values |
| `color-pearl-dim` | `#EEECE5` | Secondary text, active tab pills |
| `color-pearl-pure` | `#FFFFFF` | High-contrast badges, focus highlights |

### 2.3 Accent Palette — Electric Coral
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `color-coral-primary`| `#FF625E` | Primary CTA buttons, debit expenses, active route indicators |
| `color-coral-hover` | `#FF7770` | Button hover state, interactive chart highlights |
| `color-coral-tint` | `#FFE4E0` | Coral pill badge background (with opacity `rgba(255, 98, 94, 0.15)`) |

### 2.4 Supporting & Semantic Indicators
| Semantic Role | Token Name | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Success / Inflow** | `color-success` | `#29B887` | Income deposits, balanced ledger status, upward growth |
| **Warning / Review** | `color-warning` | `#F4B942` | Uncertain categorization, pending verification |
| **Error / Alert** | `color-error` | `#E74C3C` | Discrepancy mismatch, invalid token |
| **Muted Slate** | `color-muted` | `#8792A5` | Timestamps, table labels, inactive icons |
| **Transfer / Neutral**| `color-transfer`| `#38BDF8` | Account sweeps, internal P2P transfers |

---

## 3. Typography Scale & Font Families

- **Display & Headings**: `Inter` / `SF Pro Display` (Font weights: 600 SemiBold, 700 Bold, tracking: `-0.02em` to `-0.01em`)
- **Body & Controls**: `Inter` / `SF Pro Text` (Font weights: 400 Regular, 500 Medium)
- **Financial Numbers & References**: `JetBrains Mono` / `SF Pro Rounded` (Tabular numbers `font-feature-settings: "tnum"`)

| Level | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 48px | 700 | 56px | -0.025em | Landing Hero |
| `headline-xl` | 32px | 700 | 40px | -0.02em | KPI Totals |
| `headline-lg` | 24px | 600 | 32px | -0.01em | Section Titles |
| `headline-md` | 20px | 600 | 28px | -0.01em | Card Titles |
| `body-lg` | 16px | 400 | 24px | 0 | Subtitles |
| `body-md` | 14px | 400 | 20px | 0 | Table Rows, Inputs |
| `label-mono` | 14px | 500/700 | 20px | 0 | Financial Numbers (₹) |
| `caption-sm` | 12px | 500 | 16px | +0.02em | Badges, Timestamps |

---

## 4. Spacing, Elevation & Corner Radii

### 4.1 Spacing Tokens
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-6`: 24px
- `space-8`: 32px
- `space-12`: 48px
- `space-16`: 64px

### 4.2 Corner Radii
- `radius-sm`: 8px (Pills, badges, buttons)
- `radius-md`: 12px (Input fields, nested elements)
- `radius-lg`: 16px (Card containers, table frames)
- `radius-xl`: 20px (Modal sheets, hero mockups)

---

## 5. 120Hz Motion UI Physics & Animation Tokens

Targeting butter-smooth 120Hz refresh rates with fallback to 60Hz:

| Motion Type | Duration | Easing Function | Applied Components |
| :--- | :--- | :--- | :--- |
| **Micro-Interactions** | `120ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Button press, toggle switch, hover glow |
| **Component Transitions**| `200ms` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Dropdown expansion, tab indicator slide |
| **Page / Route Motion** | `320ms` | `cubic-bezier(0.25, 1, 0.5, 1)` | Screen crossfade and slide |
| **Chart Entrances** | `650ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Area fill draw, donut ring expansion |
| **Modal / Bottom Sheet** | `280ms` | Spring (`damping: 28, stiffness: 350`)| Mobile filters, review slide-overs |
