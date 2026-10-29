# Offnot Energy Management System - Supabase Integration & Multi-Branch Architecture

Comprehensive upgrade introducing `src/lib/supabase.ts` with Supabase client helpers, a zero-balance clean accounting state, dedicated Superadmin authentication and staff account provisioning, and multi-branch operations tracking with global consolidation.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1:
> - **Branch Monitoring**: Global branch switcher enabling consolidated multi-branch analytics as well as drill-downs into specific depots/showrooms.
> - **Accounting Zero-Slate**: Preserves the catalog definitions, categories, and technical specs, while setting all transaction records, sales, expenses, and starting stock levels to **Zero (0)** for clean audit readiness.
> - **Authentication & Staff Provisioning**: Standalone authentication gateway with Superadmin credentials and an in-app User Management portal where Superadmin can create, edit, activate/deactivate, and assign roles and branches to staff members.

---

## 1. Overview & Core Concept

Offnot Energy is expanding from a single facility into a multi-branch solar distribution and engineering powerhouse across Oyo State and Nigeria. This update transitions the application from a demo-seeded environment into a production-ready system:

1. **`src/lib/supabase.ts` Database Client & Query Helpers**:
   - Initializes `@supabase/supabase-js` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Exports typed helper methods for transactional CRUD: `supabaseGet`, `supabaseInsert`, `supabaseUpdate`, `supabaseDelete`, and RPC invocation for custom stored procedures (`fn_execute_sale`, `fn_receive_goods`, `fn_adjust_stock`).
   - Seamless dual-mode fallback: If Supabase credentials are not yet entered, it automatically defaults to the in-memory/browser persistent engine so the application never breaks.

2. **Clean-Slate Accounting (Zero Default)**:
   - Sets all financial totals, completed sales, customer receivables, supplier payables, operating expenses, and stock movement ledgers to **0.00**.
   - Products remain in the catalog with specifications (kW, kWh, W, Voltage), but with **0 initial stock**, requiring authorized opening stock counts or Goods Received Notes (GRN) to register balance.

3. **Enterprise Authentication & Superadmin Staff Provisioning**:
   - Modern, high-security login gateway with session persistence and logout capability.
   - Built-in default Superadmin account (`admin@offnotenergy.ng` / `OffnotAdmin2026!`).
   - Dedicated User & Staff Management screen allowing Superadmin to create accounts for:
     - CEO / Managing Director
     - Operations Manager
     - Inventory Officer
     - Sales Representative
     - Accountant
     - Solar Installation Engineer
   - Each staff member is assigned their active branch, role permissions, and initial password.

4. **Multi-Branch Operations & Consolidated Tracking**:
   - Branch model:
     - *Showroom - Tipper Garage, Ibadan*
     - *Main Store - Dalute Road, Ibadan*
     - *Depot 2 - Iwo Road Depot, Ibadan*
     - Ability to add new branches in other cities (Lagos, Osogbo, Oyo, Abeokuta, etc.).
   - Persistent Top-Bar **Branch Switcher** offering:
     - **All Branches (Consolidated View)**: Company-wide metrics, total inventory valuation, consolidated revenue, combined profit margins, and cross-branch performance.
     - **Specific Branch Mode**: Filters POS sales, warehouse stock levels, pending purchase receipts, and local branch expenses.

---

## 2. User Experience & Visual Design

- **Typography & Polish**: Pairs `Plus Jakarta Sans` for clean, confident display hierarchy with `JetBrains Mono` for tabular figures (`tabular-nums`), maintaining WCAG AA contrast standards.
- **Top Bar Contract**:
  - Left Zone: Offnot Energy wordmark, active branch pill switcher (`All Branches ▾`), and current breadcrumb trail.
  - Center Zone: Responsive universal search.
  - Right Zone: Active user profile, role badge, branch indicator, notifications bell, and secure Sign Out button.
- **Responsive Layout**:
  - Full desktop presence ($1440\text{px}$) with collapsible sidebar and high-density data tables.
  - Tablet & mobile optimized: sticky quick actions, bottom sheets, full touch targets ($\ge 44\text{px}$), and responsive POS cart drawer.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ OFFNOT ENERGY  ·  [ All Branches ▾ ]  /  Dashboard        [Search...]  (Admin) ⎋ │
├───────────────┬──────────────────────────────────────────────────────────────────┤
│ ❖ Dashboard   │ Multi-Branch Operational Health                          [Today] │
│ 🛒 POS Sales  ├───────────────────┬───────────────────┬──────────────────────────┤
│ 📦 Inventory  │ Today's Revenue   │ Total Valuation   │ Operating Profit         │
│ 🏢 Branches   │ ₦0.00             │ ₦0.00             │ ₦0.00                    │
│ 👥 Staff CRM  ├───────────────────┴───────────────────┴──────────────────────────┤
│ 🚚 Purchasing │ Branch Revenue & Inventory Breakdown                             │
│ 🔧 Projects   │  · Tipper Garage Showroom: ₦0.00   · Dalute Road: ₦0.00          │
│ 📊 Accounting │  · Iwo Road Depot: ₦0.00          · (+ Add Branch)               │
└───────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Technical Decisions & Architecture

```
┌────────────────────────────────────────────────────────┐
│               Offnot Energy App Engine                 │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│    src/lib/supabase.ts      │ │    Offline / Local Engine   │
│  Supabase Client & Helpers  │ │  (Zero-State Persistence)   │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
               └───────────────┬───────────────┘
                               ▼
            ┌────────────────────────────────────┐
            │          AppContext Store          │
            │  · Auth Session & RBAC             │
            │  · Active Branch Filter            │
            │  · Clean Accounting State (₦0.00)  │
            │  · Staff Provisioning Engine       │
            └────────────────────────────────────┘
```

### Planned File Structure Changes:
1. **`src/lib/supabase.ts`**: Initializer with environment configuration and helper functions (`supabaseQuery`, `fetchBranches`, `createStaffProfile`, `executeSaleRpc`).
2. **`src/types/index.ts`**: Addition of `Branch` model, user branch linkages, and auth credential interfaces.
3. **`src/services/storage.ts`**: Zero-figure default initialization (all stock, sales, expenses, and ledger entries set to 0.00; clean catalog preserved).
4. **`src/context/AppContext.tsx`**: Full authentication session state, active branch selection, staff creation handlers, and branch-filtered views.
5. **`src/components/auth/LoginView.tsx`**: High-polish authentication screen with company branding, slogan, role preview, and password visibility toggles.
6. **`src/components/branches/BranchManagement.tsx`**: Dedicated multi-branch overview comparing performance, inventory, and revenue per branch.
7. **`src/components/staff/StaffManagement.tsx`**: Superadmin control center to register new staff with custom role, branch, and credentials.
8. **Navigation & Headers**: Integrated branch selector in header and sidebar for rapid switching.

---

## 4. Verification & Acceptance Criteria

1. `src/lib/supabase.ts` exports client instance and verified helper functions.
2. Fresh launch starts at ₦0.00 for revenue, receivables, payables, stock, and expenses.
3. Superadmin can sign in, sign out, and create new employee accounts across all 7 roles.
4. Global branch switcher filters metrics to individual branches or aggregates all branches.
5. Fully responsive on mobile, tablet, and desktop viewports.
6. `compile_applet` and `lint_applet` pass with 0 errors.
