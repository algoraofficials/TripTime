# Black-Themed Expedia 6-Tab Search Suite & Bundle Engine

Replaces the existing category button row and 5-column search box in the Marketplace hero section (shown in **Image 2**) with a **black-themed Expedia 6-Tab Search Widget** modeled directly after **Image 1** (`expedia.com`), complete with custom illustrated multi-tone SVG icons for **Stays**, **Flights**, **Cars**, **Packages**, **Things to do**, and **Cruises**, tab-specific Expedia sub-controls, an interactive **Travelers & Rooms** counter popover, a **Check-in / Check-out Date Range** selector, and live **Bundle & Save** package pricing.

---

## 1. Visual Direction & Black-Theme Expedia Architecture

### Aesthetic & Theme Polarity
- **Container Surface**: Deep obsidian/black card (`bg-slate-950/95 border border-slate-800/90 rounded-3xl shadow-2xl`) replacing the old category buttons and 6-column input box inside `Marketplace.tsx` while keeping the dark homepage aesthetic.
- **Centered 6-Tab Icon Navigation Bar (Matching Image 1 Layout in Dark Mode)**:
  - Centered horizontal tab strip with bottom border (`border-b border-slate-800/90`) and custom multi-tone illustrated SVG icons above each label:
    1. **Stays** (Illustrated Duotone Bed Icon)
    2. **Flights** (Illustrated Duotone Airplane Icon)
    3. **Cars** (Illustrated Duotone Car Icon — mapped to *Chander Gari 4x4 Jeeps, Airport Car Rentals & Bangladesh Railway*)
    4. **Packages** (Illustrated Duotone Plane + Suitcase + Car Icon — *Flight/Train + Resort Bundle & Save*)
    5. **Things to do** (Illustrated Duotone Attraction Tickets Icon — *Tours, Heritage Walks & Culinary Feasts*)
    6. **Cruises** (Illustrated Duotone Cruise Ship + Sun Icon — *Saint Martin's & Sundarbans Cruises*)
  - Active tab displays a crisp `2.5px` bottom indicator bar (`border-b-2 border-sky-400 text-sky-400 font-bold`) with hover transitions (`text-slate-300 hover:text-white`).
- **Unified Rounded-Full Pill Search Bar (Matching Image 1 in Dark Mode)**:
  - High-contrast dark pill container (`bg-slate-900/95 border border-slate-700/80 rounded-full p-2 pl-5 flex flex-col lg:flex-row items-stretch lg:items-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800`) housing the location, date range, travelers/rooms popover trigger, and the right-aligned rounded-full **Search** button (`bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold px-7 py-3 rounded-full`).

---

## 2. Tab-by-Tab Expedia Functionality

### 1. **Stays** Tab (Default — Image 1 Exact Match)
- **Pill Inputs**:
  - `Where to?` (MapPin icon + destination autocomplete/dropdown across Cox's Bazar, Sreemangal/Sylhet, Bandarban, Dhaka, Sajek, plus keyword search).
  - `Mon, Oct 26 - Sun, Nov 1` (Calendar icon + interactive Check-in & Check-out date range picker).
  - `2 travelers, 1 room` (User icon + interactive popover with `+` / `-` steppers for **Rooms**, **Adults**, and **Children**).
  - `Search` button on the far right.
- **Bottom Bundle Checkboxes**:
  - `[ ] Add a flight to Bundle & Save*`
  - `[ ] Add a car / railway transfer`
  - Checking either box activates a live **Expedia Bundle & Save (Save 18%)** badge on matching hotel + transit combinations below.

### 2. **Flights** Tab
- **Expedia Sub-Navigation Row**:
  - Pill sub-tabs for `Roundtrip`, `One-way`, and `Multi-city`, plus a **Cabin Class** selector (`Economy`, `Premium Economy`, `Business / Balaka Executive`).
- **Pill Inputs**:
  - `Leaving from` (Origin airport/hub: Dhaka DAC, Chattogram CGP, Sylhet ZYL) with a 1-click **Swap Origin/Destination** button.
  - `Going to` (Destination airport: Cox's Bazar CXB, Sylhet ZYL, Saidpur SPD, Barishal BZL).
  - `Dates` (Departure & Return date range, or single date when `One-way` is selected).
  - `Travelers` (Passenger count & cabin class summary).
- **Bottom Bundle Checkbox**:
  - `[ ] Add a place to stay to Bundle & Save*`

### 3. **Cars** Tab (Mapped to Chander Gari 4x4 Jeeps, Car Rentals & Bangladesh Railway)
- **Expedia Sub-Navigation Row**:
  - Sub-tabs for `Rental Cars & Chander Gari 4x4`, `Airport / Station Transfers`, and `Bangladesh Railway Intercity`.
- **Pill Inputs**:
  - `Pick-up / Origin Station` (Dhaka Airport DAC, Kamalapur Station, Khagrachhari, Chattogram, Cox's Bazar).
  - `Drop-off / Destination` (Same as pick-up or Sajek Valley, Bandarban, Cox's Bazar Marine Drive, Sylhet).
  - `Pick-up & Drop-off Dates` + `Pick-up Time` (`10:30 AM`).
  - `Passengers / Coach Class`.

### 4. **Packages** Tab (Expedia Bundle & Save Engine)
- **Expedia Sub-Navigation Row**:
  - Toggle chips for `Flight + Stay`, `Train + Stay`, `Flight + Stay + Car`, and `Cruise + Stay` with an instant `Save up to 22% with Bundle & Save` indicator.
- **Pill Inputs**:
  - `Leaving from` (Origin hub) | `Where to?` (Destination resort city) | `Departing - Returning` | `Travelers & Rooms`.
- **Live Bundle Cards Output**:
  - Selecting **Packages** (or checking `Add a flight to Bundle & Save*` on Stays) displays a dedicated **Expedia Bundle & Save Packages** showcase pairing top Bangladesh stays (e.g., *Sayeman Beach Resort*, *Grand Sultan Tea Resort*) with transit (*Biman Flight BG-433* or *Cox's Bazar Express 814*) at an automatic bundled discount, bookable in 1 click.

### 5. **Things to do** Tab
- **Expedia Sub-Navigation Row**:
  - Quick filter chips for `All Activities`, `Outdoors & Nature`, `Food & Kacchi Walks`, `Culture & Heritage`, and `Water & Lagoon`.
- **Pill Inputs**:
  - `Going to` (Destination city or region) | `Dates` (Activity date range) | `Search` button (filters both Bangladesh experiences/restaurants and links directly to the 4 dedicated Interest pages).

### 6. **Cruises** Tab
- **Expedia Sub-Navigation Row**:
  - Quick filter chips for `All Cruises`, `Saint Martin Coral Island Liners`, `Sundarbans Mangrove Expeditions`, and `River & Haor Launches`.
- **Pill Inputs**:
  - `Going to` (`Saint Martin's Island`, `Sundarbans / Khulna`, `Kaptai & Sylhet Haor`) | `Departing between` (Date range) | `Duration` (`Any duration`, `Day Cruise (1 Day)`, `2–3 Nights`, `4+ Nights`) | `Cabin / Travelers`.

---

## 3. Architecture & File Modifications

```
+-------------------------------------------------------------------------+
|                  src/components/ExpediaSearchWidget.tsx                 |
|  - 6 Illustrated Duotone SVG Tab Icons (Stays, Flights, Cars,           |
|    Packages, Things to do, Cruises)                                     |
|  - Dynamic Tab Sub-Controls (Roundtrip/One-way, Car/Rail, Package Type) |
|  - Black-Themed Rounded-Full Pill Search Bar with Vertical Dividers     |
|  - Interactive Travelers & Rooms Popover (Rooms, Adults, Children)      |
|  - "Add a flight to Bundle & Save*" Checkbox & Live Package Combiner    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                    src/components/Marketplace.tsx                       |
|  - Replace old category row + 6-column search box with                  |
|    <ExpediaSearchWidget />                                              |
|  - Add Car Rental / Chander Gari listings & Bundle & Save Package cards |
|  - Sync widget tab selection & search button with live listing filters  |
+-------------------------------------------------------------------------+
```

### Files to Create / Modify
1. **`src/components/ExpediaSearchWidget.tsx`** *(New Component)*:
   - Implements the black-themed Expedia 6-tab search card matching **Image 1**'s layout, custom illustrated SVG icons, active blue/cyan underline, unified pill search bar, interactive **Travelers & Rooms** stepper popover, date range pickers, and tab-specific sub-controls (`Roundtrip / One-way / Multi-city`, `Add a flight to Bundle & Save*`, `Pick-up / Drop-off time`, `Cruise duration`).
2. **`src/data/mockData.ts`** *(Update)*:
   - Ensure dedicated Chander Gari 4x4 / Airport Car Rental options are clearly tagged so selecting the **Cars** tab surfaces Chander Gari Jeeps, Car Rentals, and Bangladesh Railway intercity trains seamlessly.
3. **`src/components/Marketplace.tsx`** *(Update)*:
   - Replace the old category mode tabs and 6-control search grid (lines 318–502) with `<ExpediaSearchWidget />` and render an interactive **Bundle & Save Packages** banner when `Packages` or `Add a flight to Bundle & Save*` is active.
