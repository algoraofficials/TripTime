# Dark-Theme Interest Section, Tripadvisor Button Removal & Iconic Bangladesh Artwork

Updates the **Find things to do by interest** section and dedicated interest pages (**Outdoors**, **Food**, **Culture**, **Water**) to use a dark/black homepage-matched aesthetic, removes all **Tripadvisor** buttons across the 4-card grid and dedicated interest pages, and replaces the four category pictures with newly generated high-resolution photography showcasing **Iconic Bangladesh landscapes, cuisine, heritage, and waters**.

---

## 1. Visual Direction & Domain Exemplars

### Aesthetic Direction
- **Domain**: Travel Experience & Editorial Discovery Showcase (`1_ecommerce_retail.md` + `frontend-design`)
- **Theme Polarity**: **Intentional Dark Mode** (`bg-slate-950` / `bg-slate-900/90` with `border-slate-800/80` and `text-white` / `text-slate-400`) seamlessly matching the AetherVoyage homepage canvas instead of a white card container.
- **Iconic Bangladesh Photography (4 Generated Visual Assets via `generate_image`)**:
  1. **Outdoors (`interest_outdoors_bangladesh`)**: Golden-hour aerial & trail perspective of lush terraced tea gardens in **Srimangal, Sylhet** and misty **Sajek Valley** mountain ridges in the Chittagong Hill Tracts (`3:4` portrait card aspect ratio).
  2. **Food (`interest_food_bangladesh`)**: Authentic **Old Dhaka Royal Kacchi Biryani** served in a traditional copper handi alongside saffron borhani, crispy shami kebabs, and artisan Bangladeshi pithas on a warm dark timber table (`3:4` portrait card aspect ratio).
  3. **Culture (`interest_culture_bangladesh`)**: Majestic twilight architectural view of **Ahsan Manzil (Pink Palace)** and ancient terracotta arches of **Paharpur Somapura Mahavihara / Lalbagh Fort**, softly illuminated with warm heritage lanterns (`3:4` portrait card aspect ratio).
  4. **Water (`interest_water_bangladesh`)**: Crystal-clear turquoise coral waters and traditional wooden sampan boats along **Saint Martin's Island** and tranquil **Sundarbans / Kaptai Lake** waterways at sunset (`3:4` portrait card aspect ratio).

---

## 2. Functional & UI Changes

### A. Homepage Dark/Black Background for "Find things to do by interest"
- Replace the white container (`bg-white text-slate-950 border-slate-200/80`) in `FindThingsToDoByInterestSection` with a dark/black surface (`bg-slate-950/90 border border-slate-800/80 text-white shadow-2xl`) that blends naturally with the AetherVoyage homepage aesthetic.
- Update section typography:
  - Heading (`Find things to do by interest`): `text-2xl sm:text-[28px] font-extrabold tracking-tight text-white`
  - Subheading (`Whatever you're into, we've got it`): `text-sm sm:text-base text-slate-400`
  - Card borders: `border-slate-800 group-hover:border-emerald-500/50`

### B. Complete Removal of Tripadvisor Buttons Everywhere
- **4-Card Interest Grid (`FindThingsToDoByInterestSection`)**:
  - Remove the top-right `Tripadvisor` external button (`href={item.tripadvisorUrl}`) from all four cards.
  - Retain the clean **New Window** button (`?interest=${item.id}`, `target="_blank"`) and full-card click action so users can open each dedicated interest page either in-app or in a separate browser window.
- **Dedicated Interest Pages (`InterestActivitiesPage`)**:
  - Remove the `Explore {Category} on Tripadvisor.com` button and raw Tripadvisor URL label from the category hero banner (keeping the `Open This Page in New Window` action).
  - Remove the `Tripadvisor` button from the footer of every individual attraction card so `Book Now` stands as the clean primary call-to-action.

### C. Replacing the Four Category Pictures with Iconic Bangladesh Imagery
- Generate 4 custom high-resolution images in parallel using `generate_image` (`AspectRatio: "3:4"`) for **Outdoors**, **Food**, **Culture**, and **Water**.
- Add `imageUrl: string` to `InterestCategoryMeta` in `src/components/InterestActivitiesPage.tsx`, replacing the multi-card screenshot crop offsets (`cropStyle`) with full-bleed `object-cover` rendering (`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105`) across:
  1. The 4-card **Find things to do by interest** homepage grid.
  2. The right-hand **Featured Category** hero preview card inside `InterestActivitiesPage`.
  3. The header banner of each attraction card on the dedicated interest pages.

---

## 3. Technical Architecture & File Plan

```
+-------------------------------------------------------------------------+
|                   Batch Image Generation (Turn 1 of Build)              |
|  generate_image x4 (3:4 Aspect Ratio):                                  |
|   - interest_outdoors_bd (Sylhet Tea Gardens & Sajek Valley Peaks)      |
|   - interest_food_bd     (Old Dhaka Kacchi Biryani & Traditional Feast) |
|   - interest_culture_bd  (Ahsan Manzil & Lalbagh Heritage Architecture) |
|   - interest_water_bd    (Saint Martin Coral Lagoon & Sampan Boats)     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|               src/components/InterestActivitiesPage.tsx                 |
|  - Dark/black section background (bg-slate-950/90 border-slate-800/80)  |
|  - Replace screenshot cropStyle with the 4 generated Bangladesh images  |
|  - Remove all Tripadvisor buttons on 4-card grid, hero banner & cards   |
+-------------------------------------------------------------------------+
```

### Files to Modify
- **`src/components/InterestActivitiesPage.tsx`**:
  - Update `INTEREST_CATEGORIES` with the 4 generated Iconic Bangladesh image paths and updated descriptions celebrating Bangladesh & global experiences.
  - Update `FindThingsToDoByInterestSection` to use dark/black homepage styling (`bg-slate-950/90 border-slate-800/80 text-white`), render the 4 new `object-cover` images, and remove the `Tripadvisor` button on every card.
  - Update `InterestActivitiesPage` hero banner and attraction cards to use the new category images and remove all `Tripadvisor` buttons and URLs from the UI.
