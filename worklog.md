# Worklog

## Task 3 - api-builder

### Summary
Created 23 API files for the Digital Menu Builder SaaS platform backend. All files are production-quality TypeScript with proper error handling, authentication, authorization, and validation.

### Files Created

**Authentication (4 files):**
1. `src/lib/auth.ts` - NextAuth configuration with Credentials provider, JWT/session callbacks, bcryptjs password verification
2. `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler (GET/POST)
3. `src/app/api/auth/register/route.ts` - User registration with Zod validation, bcryptjs hashing, auto-creates free subscription
4. `src/app/api/auth/profile/route.ts` - GET/PUT user profile with business memberships and active subscriptions

**Business CRUD (2 files):**
5. `src/app/api/businesses/route.ts` - POST (create with unique slug generation using crypto), GET (list user's businesses with category/analytics counts)
6. `src/app/api/businesses/[id]/route.ts` - GET/PUT/DELETE single business with ownership verification via BusinessMember

**Categories & Items (6 files):**
7. `src/app/api/businesses/[id]/categories/route.ts` - GET categories with items, POST new category with auto sort order
8. `src/app/api/businesses/[id]/categories/[categoryId]/route.ts` - PUT/DELETE category (cascade deletes items)
9. `src/app/api/businesses/[id]/categories/[categoryId]/items/route.ts` - GET/POST items with ownership and category verification
10. `src/app/api/businesses/[id]/categories/[categoryId]/items/[itemId]/route.ts` - GET/PUT/DELETE single item
11. `src/app/api/businesses/[id]/categories/reorder/route.ts` - PUT to batch update category sort orders in a transaction
12. `src/app/api/businesses/[id]/items/reorder/route.ts` - PUT to batch update item sort orders within a category

**Upload, AI, QR, Publish, Design (5 files):**
13. `src/app/api/upload/route.ts` - POST file upload (jpg/png/webp/pdf, max 10MB) using Bun.write, UUID filenames, subdirectory routing (logos/food/menus)
14. `src/app/api/businesses/[id]/ai-scan/route.ts` - POST image upload for AI scanning, saves image and creates AiScanLog placeholder
15. `src/app/api/businesses/[id]/qr/route.ts` - GET generates/retrieves QR code using `qrcode` package (PNG file + SVG string), upserts QrCode record
16. `src/app/api/businesses/[id]/publish/route.ts` - PUT to change menu upload status (draft/published/unpublished), auto-unpublishes others
17. `src/app/api/businesses/[id]/design/route.ts` - GET/PUT design settings with upsert (creates default if not exists)

**Analytics & Public Menu (3 files):**
18. `src/app/api/businesses/[id]/analytics/route.ts` - GET aggregated analytics (today/week/month views, QR scans, most viewed items/categories, 30-day daily data)
19. `src/app/api/analytics/track/route.ts` - POST public endpoint to track view/scan events (no auth required)
20. `src/app/api/menu/[slug]/route.ts` - GET public menu by slug (no auth), includes business info, categories with visible items, design settings, auto-tracks view

**Admin Routes (3 files):**
21. `src/app/api/admin/stats/route.ts` - GET platform stats (total users, businesses, published menus, scans, monthly growth)
22. `src/app/api/admin/businesses/route.ts` - GET all businesses with pagination/search/status filter, PUT to suspend/delete
23. `src/app/api/admin/templates/route.ts` - GET/POST/PUT/DELETE menu templates (admin-only CRUD)

### Key Patterns Used
- All auth routes use `getServerSession(authOptions)` from `@/lib/auth`
- Business ownership verified through `BusinessMember` table with role checks
- Zod schemas for all input validation with safeParse and descriptive error responses
- Proper HTTP status codes: 200, 201, 400, 401, 403, 404, 409, 500
- `NextResponse.json()` for all responses
- `db` imported from `@/lib/db` (shared Prisma instance)
- File uploads use Bun.write with UUID filenames
- QR code generation uses `qrcode` package for both PNG and SVG
- Slug generation: lowercase, hyphens for spaces/special chars, 4-char hex suffix for uniqueness
- ESLint passes with zero errors

---

## Task 5 - Dashboard Layout & Overview Page

### Summary
Created the main dashboard shell (DashboardLayout) and overview/home page (OverviewPage) for the MenuQR SaaS platform. Both files use client-side SPA routing via Zustand, shadcn/ui components, and follow mobile-first responsive design with the brand color system (#1a1a2e dark, #e94560 accent).

### Files Created

1. **`src/components/dashboard/DashboardLayout.tsx`** — Main dashboard layout shell component (named export `DashboardLayout`)
   - **Mobile top bar** (visible < md): ALTECH logo, business name, hamburger Sheet trigger
   - **Desktop sidebar** (visible md+, fixed left, w-64, bg-[#1a1a2e]): Brand logo with "by ALTECH" subtitle, business switcher DropdownMenu (multi-business), 10 navigation items with lucide icons, active item highlighted with #e94560, scrollable via ScrollArea
   - **Mobile sidebar** (Sheet from shadcn/ui, left side): Full navigation matching desktop sidebar, auto-closes on nav
   - **Main content area** (right of sidebar): Sticky top bar with page title, business name Badge, user Avatar with DropdownMenu (Account Settings, Business Settings, Sign Out)
   - Navigation items: Overview, Menu Manager, Upload Menu, AI Menu Scanner, Design Templates, QR Code, Customer Preview, Analytics, Business Settings, Account Settings, Sign Out
   - Business switcher uses `useAuthStore.businesses` / `setCurrentBusiness` and navigates to dashboard on switch
   - Sign out calls `authApi.logout()` then resets stores

2. **`src/components/dashboard/OverviewPage.tsx`** — Dashboard overview/home page (named export `OverviewPage`)
   - **Welcome section**: "Welcome back, {user.first_name}" with current business name and menu status badge (Published/Draft/Unpublished)
   - **Stats cards row** (4 cards, responsive 2×2 on mobile → 4 columns on lg): Total Menu Items (from category API), Total Menu Views (from analytics API), QR Scans (from analytics API), Menu Status
   - **Quick Actions** grid (6 cards, 1 col mobile → 2 col sm → 3 col lg): Create Menu Manually, Upload Existing Menu, Scan with AI, Choose Design, Get QR Code, View Analytics — each with icon, title, description, arrow, color-coded
   - **Recent Activity** section: Dynamic list generated from fetched data (category creation, QR scans, menu views, item updates) or empty state with CTA to create menu
   - Data fetching via `useEffect` with `Promise.allSettled` for parallel analytics + categories, cleanup-safe
   - Loading states with Skeleton components on all data-dependent sections

### Key Patterns Used
- `'use client'` directive on both files
- Client-side navigation via `useAppStore.setCurrentPage` (not useRouter)
- Brand colors: `bg-[#1a1a2e]` sidebar, `bg-[#e94560]` active highlights and CTAs
- shadcn/ui components: Sheet, DropdownMenu, Avatar, ScrollArea, Separator, Badge, Skeleton, Card, Button
- lucide-react icons throughout
- `toast` from sonner for user feedback (business switch, sign out)
- Mobile-first responsive: `md:` and `lg:` breakpoints, `min-w-0` with `truncate` for text overflow
- API calls: `analyticsApi.get(businessId)` and `categoryApi.list(businessId)` via `@/lib/api`
- ESLint passes with zero errors on both new files

---

## Task 6 - Menu Manager Page & Upload Menu Page

### Summary
Created two production-quality dashboard pages for the MenuQR SaaS platform: a full-featured visual menu builder with drag-and-drop reordering (MenuManagerPage) and an upload/preview/publish page for existing menu files (UploadMenuPage). Both use client-side SPA routing via Zustand, shadcn/ui components, and follow the established brand color system.

### Files Created

1. **`src/components/dashboard/MenuManagerPage.tsx`** — Visual menu builder (named export `MenuManagerPage`)
   - **Two-column layout**: Categories panel (left, 320px on desktop) + Items panel (right), stacked on mobile
   - **Categories panel**: "Add Category" button, draggable sortable list with @dnd-kit, each category shows name + item count badge + visibility toggle (Eye/EyeOff) + edit (Pencil) + delete (Trash2) + drag handle (GripVertical). Selected category highlighted with #e94560 ring
   - **Items panel**: Header with category name + item count + "Add Item" button, draggable sortable item cards with @dnd-kit. Each card shows: thumbnail (16×16 with ImageOff fallback), name (bold), description (truncated, muted), price (₦ formatted), availability Switch, edit/duplicate/delete buttons, drag handle
   - **Item Form Dialog**: Uses key-based remount pattern (ItemFormInner + ItemFormDialog) to avoid useEffect setState lint issue. Form includes: image upload with preview/clear, name (required), description (textarea), price (number with ₦ prefix), Save/Cancel buttons
   - **Category Dialog**: Add/rename dialog with name input
   - **Delete Confirmation**: AlertDialog for both categories (shows item count warning) and items
   - **Auto-save indicator**: "Saving..." / "Saved" badge with 1.5s debounce timer after reorders
   - **Empty states**: No categories → "Create your first menu category" with CTA. No items → "Add your first menu item" with CTA. No category selected → "Select a category" prompt
   - **DnD integration**: @dnd-kit/core (DndContext, closestCenter, PointerSensor, KeyboardSensor), @dnd-kit/sortable (SortableContext, verticalListSortingStrategy, useSortable), @dnd-kit/utilities (CSS.Transform)
   - **Data flow**: Fetches categories on mount via categoryApi.list, all mutations call API then update store, reorders persist via categoryApi.reorder/itemApi.reorder, duplicate creates via API
   - **Loading state**: Full skeleton layout matching the two-column structure

2. **`src/components/dashboard/UploadMenuPage.tsx`** — Upload/preview/publish page (named export `UploadMenuPage`)
   - **No upload state**: Large dashed-border dropzone with drag-and-drop support (onDragOver/onDragLeave/onDrop), click-to-upload, CloudUpload icon, format badges (JPG/PNG/WEBP/PDF), 10MB size limit, file validation with error display. Three info cards below (Image Menus, PDF Menus, Publish & Share)
   - **Upload exists state**: Two-column layout — left: file preview (image or PDF iframe), file metadata; right sidebar with status card (current status badge, upload date) and actions card
   - **Status badges**: Draft (gray), Published (emerald with Globe icon), Unpublished (amber with GlobeLock icon)
   - **Action buttons**: Publish Menu (green, emerald-600) / Unpublish Menu (orange, amber), Preview Menu (opens full-screen Dialog), Replace Menu (triggers file input), Delete Menu (red, with AlertDialog confirmation)
   - **Post-publish**: Success toast with 5s duration + action button "View QR Code" that navigates via setCurrentPage. Green "Menu is Live" info card with link to QR code page
   - **Full-screen preview dialog**: Large Dialog (max-w-5xl, 90vh) with image or PDF embed, "Open in New Tab" button
   - **Loading state**: Skeleton header + skeleton preview area

### Key Patterns Used
- `'use client'` directive on both files
- Client-side navigation via `useAppStore.setCurrentPage` (not useRouter)
- Brand colors: `bg-[#e94560]` primary CTAs, emerald for publish/success, amber for unpublish/warning, red for delete
- shadcn/ui components: Card, Button, Dialog, AlertDialog, Input, Label, Textarea, Switch, Badge, Skeleton, ScrollArea, Separator
- lucide-react icons: Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, ImageOff, Copy, Loader2, Check, Upload, FileText, Globe, GlobeLock, CloudUpload, etc.
- `toast` from sonner for all success/error notifications
- @dnd-kit for drag-and-drop with 5px activation constraint to avoid accidental drags
- Nigerian Naira formatting: `₦{price.toLocaleString()}`
- Mobile-first responsive: grid-cols-1 lg:grid-cols-[320px_1fr] for MenuManager, grid-cols-1 lg:grid-cols-[1fr_320px] for UploadMenu
- API integration: categoryApi, itemApi, uploadApi, menuUploadApi from `@/lib/api`
- ESLint passes with zero errors on both new files (pre-existing error in CreateBusinessPage.tsx is unrelated)

---

## Task 7 - AI Scanner Page & Design Templates Page

### Summary
Created two production-quality dashboard pages: an AI-powered menu scanning feature with multi-step flow (AiScannerPage) and a template selection + design customization page (DesignTemplatesPage). Both follow established patterns with Zustand client-side routing, shadcn/ui components, framer-motion animations, and the brand color system.

### Files Created

1. **`src/components/dashboard/AiScannerPage.tsx`** — AI menu scanner (named export `AiScannerPage`)
   - **Three-step flow**: `upload` → `scanning` → `review`, managed with local state
   - **Step 1 (Upload)**: Large dashed-border dropzone with drag-and-drop support, accepts JPG/PNG/WEBP/PDF (10MB max). On file select: shows image preview with file metadata, "Scan Menu" CTA button. Three info cards (AI-Powered, Instant Results, Review & Edit). Click-to-browse fallback.
   - **Step 2 (Scanning)**: Animated scanning state with framer-motion rotating border spinner + ScanLine icon center, "AI is analyzing your menu..." text, progressive hint badges (Reading image → Detecting items → Extracting prices → Categorizing) with staggered opacity animation. Calls `aiScanApi.upload()` for server-side logging, then `scanWithAI()` using `z-ai-web-dev-sdk` `createVlm` with base64 image + structured prompt requesting JSON array of `{name, description, price, category}`. Parses response with regex `
[[\s\S]*\]` to extract JSON array, maps to `DetectedItem[]` format. Handles empty results and errors gracefully with toast messages.
   - **Step 3 (Review)**: Green success banner showing item count. Action bar: "Add Item" (adds blank row), "Clear All" (with confirmation toast), "Re-scan" (resets to upload). Scrollable list (max-h-60vh) of detected items, each in a Card with: index badge, Name input, Category (shadcn Select with 20 common Nigerian restaurant categories + custom text input fallback), Description input, Price input with ₦ prefix, Trash2 remove button. Fields use `updateDetectedItem` / `removeDetectedItem` / `addDetectedItem` from `useAiScanStore`. Sticky bottom bar with item count and "Save to Menu" button.
   - **Save to Menu**: Groups items by category, creates each category via `categoryApi.create`, then creates each item via `itemApi.create` (FormData). Updates `useMenuStore` with `addCategory`/`addItem`. Shows success toast with category + item counts, navigates to menu-manager page.
   - **DetectedItemRow**: Extracted as separate component for cleaner JSX. Handles common vs custom category display.
   - framer-motion AnimatePresence with mode="wait" for step transitions, staggered row entry animations.

2. **`src/components/dashboard/DesignTemplatesPage.tsx`** — Template selection & customization (named export `DesignTemplatesPage`)
   - **Template Grid**: 10 templates in responsive grid (2 cols mobile, 3 sm, 4 lg, 5 xl). Each card shows: mini mock preview (h-48, header bar in primary color, 3 mock menu item lines, background in template bg color), template name, active checkmark overlay (ring-2 + filled circle with Check icon), Premium badge (amber, Crown icon) for 3 premium templates, "Use Template" / "Active" button (fades in on hover, always visible when active).
   - **Template definitions**: 10 templates (Classic Restaurant, Modern, Luxury, Minimal, Fast Food, Café, Pizza, Dark Premium, Colorful, Elegant) with `id`, `name`, `colors: {primary, bg}`, `isPremium`. Dark Premium has special dark-bg handling in preview.
   - **Customization Panel**: Three cards in responsive grid (1 col mobile, 2 md, 3 xl):
     - Colors card: Primary + Secondary color pickers (native input type="color" + hex Input with font-mono)
     - Layout & Typography card: Font Style (Modern/Classic/Elegant/Casual), Background (Light/Dark/Warm/Cool), Logo Position (Top Center/Top Left/Top Right/Hidden), Menu Layout (Grid/List/Compact) — all shadcn Select components
     - Settings card: WhatsApp Ordering toggle (Switch) with animated number input reveal (framer-motion height/opacity), SEO Indexing toggle (Switch) with descriptions
   - **Data flow**: On mount fetches existing design via `designApi.get(businessId)` and populates `useDesignStore`. Template selection updates store with template ID + primary color. Save calls `designApi.update` with all design store fields.
   - **Actions**: "Preview with Template" button navigates to preview page, "Save Design" button with loading state.
   - Loading state: Skeleton grid matching template layout.

### Key Patterns Used
- `'use client'` directive on both files
- Client-side navigation via `useAppStore.setCurrentPage`
- Brand colors: `bg-[#e94560]` primary CTAs, emerald for success/saved states, violet for AI branding
- shadcn/ui components: Card, Button, Input, Label, Badge, Select, Switch, Separator, Skeleton
- framer-motion: AnimatePresence (mode="wait"), motion.div for step transitions and staggered list entry, motion.div for rotating spinner
- `z-ai-web-dev-sdk`: `createVlm` imported dynamically (await import) for AI vision scan on client side
- `toast` from sonner for all success/error notifications
- Nigerian Naira (₦) symbol used throughout for price fields
- Mobile-first responsive: grid breakpoints, `sm:hidden` / `hidden sm:flex` for conditional elements
- ESLint passes with zero errors on both new files

---

## Task 8 - QR Code, Preview, and Analytics Pages

### Summary
Created three production-quality dashboard pages for the MenuQR SaaS platform: a QR code generation/management page, a multi-device menu preview page, and a comprehensive analytics dashboard with recharts visualizations. All follow established patterns with Zustand client-side routing, shadcn/ui components, mobile-first responsive design, and the brand color system.

### Files Created

1. **`src/components/dashboard/QrCodePage.tsx`** — QR code management (named export `QrCodePage`)
   - **QR Code Display**: Large centered QR code image (280×280 mobile, 320×320 desktop) in a dashed-border frame, fetched from `qrApi.get(businessId)` returning `{slug, pngUrl, svgUrl}`
   - **Menu URL**: Readonly input showing `{origin}/menu/{slug}` with a copy button alongside it
   - **Action buttons row** (responsive grid, 2 cols mobile, 4 cols desktop): Download PNG (anchor element with download attribute), Download SVG (disabled if not available), Copy Link (clipboard API with sonner toast), Share (Web Share API with clipboard fallback)
   - **Print button**: Creates a hidden iframe with the QR code, business name, and "Scan to view our digital menu" text, then triggers `window.print()`
   - **Info cards** (3 cards, 1 col mobile, 3 col md): Permanent QR Code (ShieldCheck, emerald), Print & Place Anywhere (Printer, violet), Instant Digital Access (Smartphone, sky)
   - **Loading state**: Centered skeleton layout with QR frame, URL input, and action button skeletons
   - **Error state**: Red icon, error message, "Try Again" button
   - All download/share/copy actions provide sonner toast feedback

2. **`src/components/dashboard/PreviewPage.tsx`** — Multi-device menu preview (named export `PreviewPage`)
   - **Preview mode toggle**: 3 buttons (Mobile/ Desktop/ Full Screen) in a pill-style toggle bar, mobile defaults selected
   - **Phone frame**: Realistic iPhone-style shell with 6px dark border, rounded-[40px], notch (150×28px), 375×812 viewport, scrollable inner content area
   - **Desktop frame**: Browser-chrome mock with traffic-light dots (red/amber/green), URL bar showing `menuqr.app/menu/your-business`, max-w-[1024px], max-h-[600px] scrollable
   - **Full screen mode**: shadcn/ui Dialog filling the entire viewport (100vw × 100vh, no border/radius), ScrollArea with max-w-lg centered content, closes back to mobile mode
   - **Preview content** (MenuPreviewContent component): Full menu simulation using fetched categories + design data — business logo (circular, bordered), business name in primaryColor, description, scrollable category pill buttons (active = secondaryColor), menu items in grid (2-col) or list layout based on `menuLayout` design setting, each item shows image (or ImageIcon placeholder), name, truncated description, ₦-formatted price in secondaryColor, WhatsApp order button if enabled (green #25D366)
   - **Design application**: Font family mapping (modern/classic/playful/minimal), light/dark background styles, primary/secondary colors applied throughout
   - **Data flow**: On mount fetches categories via `categoryApi.list` and design via `designApi.get`, syncs design to `useDesignStore`, manages local category and design state
   - **Loading/error/empty states**: Skeleton phone frame, error card with retry, "No menu items yet" empty state with UtensilsCrossed icon

3. **`src/components/dashboard/AnalyticsPage.tsx`** — Analytics dashboard (named export `AnalyticsPage`)
   - **Stats Cards Row** (4 cards, 2×2 mobile → 4 col lg): Total Views (Eye, sky), QR Scans (QrCode, violet), Views Today (Calendar, amber), Views This Month (CalendarDays, emerald) — big bold numbers with `toLocaleString()`, Skeleton loading state
   - **Charts Section** (2-col grid on lg):
     - **Left — Views Over Time**: AreaChart (recharts) with `dailyViews` data, gradient fill (#e94560 → transparent), formatted XAxis dates (MM/DD), integer YAxis, custom tooltip, 300px height, ResponsiveContainer
     - **Right — Top Categories**: Donut PieChart (innerRadius=45, outerRadius=80) with 7-color palette, legend list alongside showing colored dots + category names + view counts
   - **Tables Section** (2-col grid on lg):
     - **Most Viewed Items**: shadcn Table with columns #, Item Name, Category (hidden on mobile), Views (right-aligned, tabular-nums). Shows top 10 items with mostViewedItems from API
     - **Recent Activity**: List of daily view entries (reversed, last 8) with Eye icon, date, view count, and TrendingUp indicator
   - **Custom Tooltip**: Clean white card with shadow showing date and formatted view count
   - **Empty state**: When all analytics values are 0 and arrays empty — centered BarChart3 icon, "No analytics data yet" message, CTA button to navigate to QR Code page
   - **Error state**: Red icon, error message, "Try Again" button
   - All chart colors use the brand palette: `#e94560` accent, `#1a1a2e` dark, plus amber/emerald/violet/pink/teal for variety

### Key Patterns Used
- `'use client'` directive on all three files
- Client-side navigation via `useAppStore.setCurrentPage` (analytics empty state CTA)
- Brand colors: `#e94560` for primary accent in charts/CTAs, `#1a1a2e` as secondary dark, sky/violet/amber/emerald for stat card variety
- shadcn/ui components: Card, Button, Input, Skeleton, Dialog, ScrollArea, Table, TableHeader, TableBody, TableHead, TableRow, TableCell
- recharts: AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer — with linearGradient fill, custom Tooltip component, inner donut style
- lucide-react icons: Eye, QrCode, Calendar, CalendarDays, BarChart3, TrendingUp, Download, FileCode, Link2, Share2, Printer, ShieldCheck, Smartphone, Monitor, Maximize, MessageCircle, Clock, ArrowRight
- `toast` from sonner for download/copy/share feedback
- Mobile-first responsive: grid-cols-2 lg:grid-cols-4 for stats, grid-cols-1 lg:grid-cols-2 for charts/tables, `hidden sm:table-cell` for table columns, `sm:hidden`/`hidden sm:inline` for button labels
- Loading states: Skeleton components throughout (stat values, chart areas, table rows, device frames)
- Error and empty states with retry CTA buttons on all pages
- `toLocaleString()` for number formatting across all components
- ESLint passes with zero errors on all three new files

---

## Task 9 - Business Settings, Account Settings & Admin Pages

### Summary
Created three production-quality dashboard pages for the MenuQR SaaS platform: a comprehensive business settings editor with logo management and danger zone, a user account settings page with profile/security/subscription management, and a platform admin dashboard with tabbed interface. All follow established patterns with Zustand client-side routing, shadcn/ui components, mobile-first responsive design, and the brand color system.

### Files Created

1. **`src/components/dashboard/BusinessSettingsPage.tsx`** — Business settings editor (named export `BusinessSettingsPage`)
   - **Sticky save button**: Top-right positioned Save Changes button with loading spinner state
   - **Business Information card**: Name input (required), Category select (8 options: Restaurant, Café, Hotel, Bar, Food Truck, Bakery, Catering, Other), Description textarea
   - **Contact Information card**: Phone (type tel), WhatsApp number (type tel, MessageCircle icon), Address textarea
   - **Opening Hours card**: Single textarea with placeholder example "Mon-Fri: 9AM-10PM, Sat-Sun: 10AM-11PM"
   - **Business Logo card**: Current logo display (24×24 bordered container with object-contain), Upload new logo button (hidden file input, validates image type and 2MB max, calls `uploadApi.upload`), Remove logo button (red, X icon). Replace/Upload label toggles based on existing logo
   - **Danger Zone card**: Red-bordered card with AlertTriangle icon, warning text about permanent deletion, Delete Business button (destructive variant, opens AlertDialog with full confirmation text, calls `businessApi.delete`). On success: switches to next business or logs out and navigates to landing
   - **Save handler**: Creates FormData with all fields (name, category, description, phone, whatsapp, address, openingHours, logoUrl), calls `businessApi.update`, updates both `currentBusiness` and `businesses` array in auth store
   - **Pre-fill**: All form fields populated from `currentBusiness` on mount via useEffect
   - **Loading state**: 4 skeleton cards while initializing
   - **Null guard**: Shows "No business selected" card if `currentBusiness` is null

2. **`src/components/dashboard/AccountSettingsPage.tsx`** — Account settings (named export `AccountSettingsPage`)
   - **Profile card**: Large Avatar (h-20, w-20) with initials derived from user name, Name input, Email input (disabled, gray background, with note "Email cannot be changed"), Save Profile button
   - **Security card**: Change Password section — Current Password, New Password (min 8 chars validation), Confirm New Password (match validation), Update Password button. Shows toast "Password updated successfully" on click (placeholder, no API endpoint yet). All fields reset after success
   - **Businesses card**: Lists all user businesses from `useAuthStore.businesses`, each showing name (truncated), status badge (active/suspended/pending), plan badge (outline), category. Click "Switch" to switch business via `setCurrentBusiness` + navigate to dashboard
   - **Subscription card**: Dynamic plan display (Free/Pro/Business) with colored background cards (gray/amber/violet), plan icon (User/Sparkles/Crown), feature checkmark list (5/7/9 features per plan), contextual CTA (Free→Upgrade, Pro→Upgrade to Business, Business→"highest plan" success message), upgrade button shows "Coming soon" toast
   - **Helper functions**: `getInitials()` extracts up to 2 uppercase initials from name
   - **Loading state**: 3 skeleton cards while initializing
   - **Null guard**: Shows login prompt if user is null

3. **`src/components/dashboard/AdminPage.tsx`** — Platform admin dashboard (named export `AdminPage`)
   - **Access control**: If `user.role !== 'admin'`, shows centered Lock icon + "Access Denied" message with description
   - **Admin banner**: Subtle primary-tinted top bar with Shield icon, "Platform Administration" title
   - **Tabbed interface** (shadcn Tabs, 3 tabs with icons + labels, mobile shows icons only):
     - **Overview tab**: Fetches `adminApi.getStats()`, displays 4 stat cards (Total Users, Total Businesses, Published Menus, Total QR Scans) with icons, big bold numbers (toLocaleString), descriptions, Skeleton loading state, error state with retry message
     - **Businesses tab**: Fetches `adminApi.getBusinesses(page)` with pagination. Desktop: shadcn Table with columns (Name, Category, Plan badge, Status badge active=green/suspended=red, Created date formatted, Actions). Mobile: Card-based list view with stacked layout. Actions: Suspend/Activate toggle button (Pause/Play icon, calls `adminApi.updateBusiness`), Delete button (Trash2, AlertDialog confirmation, sets status to deleted). Pagination controls (Previous/Next, page X of Y, disabled at boundaries)
     - **Templates tab**: "Coming soon" amber info card with LayoutTemplate icon, management table listing all 10 templates from DesignTemplatesPage (Name, Type Free/Premium badge, Active status, View button disabled)
   - **StatCard component**: Reusable stat card with icon, label, value, description, loading skeleton
   - **OverviewTab, BusinessesTab, TemplatesTab**: Extracted as separate internal components for clean organization

### Key Patterns Used
- `'use client'` directive on all three files
- Client-side navigation via `useAppStore.setCurrentPage` (business switch, post-delete redirect)
- shadcn/ui components: Card, Button, Input, Label, Textarea, Select, Tabs, Table, AlertDialog, Badge, Separator, Avatar, Skeleton
- lucide-react icons: Building2, Phone, MessageCircle, MapPin, Clock, ImageIcon, Upload, Trash2, Save, Loader2, AlertTriangle, X, User, Shield, CreditCard, Lock, Check, Crown, Sparkles, Mail, Users, QrCode, BarChart3, ChevronLeft, ChevronRight, Pause, Play, Eye, LayoutTemplate
- `toast` from sonner for all success/error notifications
- Mobile-first responsive: `sm:` and `md:` breakpoints, `hidden sm:block`/`sm:hidden` for table/list view toggling, `w-full sm:w-auto` for buttons
- Loading states: Skeleton components throughout (forms, stat cards, table rows)
- Error handling: try/catch with toast.error on all API calls, inline error messages for form validation
- Form validation: required name check, password min 8 chars, password confirmation match, image type/size validation
- AlertDialog for destructive confirmations (delete business, delete in admin)
- Store updates after mutations (setCurrentBusiness, setBusinesses, setUser)
- ESLint passes with zero errors on all three new files

## Task - Public Menu Page (PublicMenuPage.tsx)

### Summary
Built the complete customer-facing public menu page component for the MenuQR SaaS platform. This is the beautiful, mobile-first page customers see when they scan a QR code. Also updated the public menu API route to return the expected response format with separate `categories`, `design`, and `upload` fields, and support for unpublished business state.

### Files Modified
- `src/app/api/menu/[slug]/route.ts` — Updated to return structured format with separate `business`, `categories`, `design`, `upload` fields. Added support for unpublished businesses and included menu uploads in the response.

### Files Created
- `src/components/public/PublicMenuPage.tsx` — Complete public menu page component (~1230 lines)

### Features Implemented

**Data Flow:**
- Fetches slug from `useAppStore.pageParams.slug`
- Calls `publicMenuApi.getBySlug(slug)` on mount with cleanup on unmount
- Tracks view via `analyticsApi.track({ businessId, eventType: 'view' })`

**State Handling:**
- **Loading**: Centered spinner with "Loading menu..." text
- **Error/Not Found**: Clean "Menu Not Found" message with MenuQR by ALTECH branding, UtensilsCrossed icon
- **Unavailable**: "Menu Unavailable" message for unpublished businesses

**Two Display Modes:**
1. **Uploaded Menu Mode** — When upload exists and is published with no manual categories/items
   - Full-width image display with `touch-action: pan-x pan-y pinch-zoom` for native zoom
   - PDF displayed in embedded iframe
   - Image loading skeleton

2. **Digital Menu Mode** — Full featured digital menu

**Header Section (sticky):**
- Circular business logo (80x80, with secondaryColor border)
- Business name (large, bold, white on primaryColor background)
- Description (muted, 2-line clamp)
- Opening status: Parses JSON openingHours to determine "Open Now" (green dot) or "Closed" (red dot) with hours text
- Contact row: Phone (tel: link), WhatsApp (wa.me link), Address (Google Maps link) as icon buttons
- All styled with secondaryColor accents on primaryColor background

**Search Bar (sticky below header):**
- Search icon + "Search menu..." placeholder
- Real-time client-side filtering across all categories
- Clear button (X) when query is active
- "No items match your search" empty state with "Clear search" link
- Results count display

**Category Navigation (sticky below search):**
- Horizontal scrollable pill/tab bar (hidden scrollbar)
- Active tab highlighted with secondaryColor, shadow
- Smooth scroll to category section on click
- IntersectionObserver auto-detects active category during scroll
- Only shows when >1 category and not in search mode

**Menu Items (3 layout modes):**
- **grid**: 2-col mobile, 3-col tablet, 4-col desktop — aspect-square images, full card layout
- **list**: Single column, 80px thumbnails, horizontal layout
- **compact**: Single column, 56px thumbnails, minimal spacing
- Each card: food image (rounded, lazy-loaded) or UtensilsCrossed placeholder, name, description (2-line clamp), price (₦ formatted), "Sold Out" badge overlay
- Quantity selector (+/- buttons) on each card when WhatsApp ordering enabled

**WhatsApp Ordering:**
- Per-item quantity selectors (+/- buttons with animated transitions)
- Floating WhatsApp FAB when cart is empty
- Bottom cart bar when cart has items, showing item count + total
- "Send Order" button generates formatted WhatsApp message with emoji formatting
- Opens wa.me link with encoded order text in new tab

**Design Settings Applied:**
- `primaryColor`: Header background, active states
- `secondaryColor`: Price text, badges, accent buttons, focus rings
- `backgroundStyle`: light (white), dark (#1a1a2e), warm (#FFF8F0), cool (#F0F4FF) — full theme class system
- `fontStyle`: modern (sans), classic (serif), playful (sans), minimal (sans)
- `menuLayout`: grid/list/compact item display

**Accessibility & Performance:**
- Semantic HTML (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`)
- ARIA roles: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-label` on all buttons
- Lazy loading on all food images with `loading="lazy"`
- Minimum 44px touch targets
- CSS transitions only (no heavy JS animation)

**Technical Details:**
- `'use client'` directive, minimal shadcn/ui (Badge only), mostly plain Tailwind CSS 4
- Zero ESLint errors
