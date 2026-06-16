# FRONTEND_SPECS.md - Free Classroom Finder

This specification outlines the UI/UX design, visual guidelines, page components, and state management for the Next.js frontend of the **Free Classroom Finder** application.

---

## 1. UI/UX & Styling Guidelines

The application follows a clean, academic, and trustworthy design system, using a professional color palette and highly responsive layouts.

### 1.1 Color Palette
We use standard Tailwind CSS utility classes aligned with our design goals:
- **Backgrounds**:
  - Main Pages: Crisp White (`bg-white`)
  - Sub-sections / Alternate Sections: Slate Off-White (`bg-slate-50` or `bg-slate-100`)
- **Primary Headers & Navigation**:
  - Deep Blue (`bg-blue-900` or `text-blue-900`)
- **Primary Interactive Elements & Active States**:
  - Royal Blue (`bg-blue-600` / `hover:bg-blue-700` / `text-blue-600`)
- **Typography / Text**:
  - Primary Text: Charcoal/Slate (`text-slate-800`)
  - Secondary Text: Medium Slate (`text-slate-600` or `text-slate-500`)
- **Accents & Statuses**:
  - Success / Available: Emerald Green (`text-emerald-600`, `bg-emerald-50`)
  - Warning / Conflicting: Amber Orange (`text-amber-600`, `bg-amber-50`)
  - Danger / Error: Rose Red (`text-rose-600`, `bg-rose-50`)

### 1.2 Typography
- **Font Family**: Modern sans-serif typography (`Inter`, standard Next.js font setup).
- **Headings**: Semibold and bold weights for academic authority (`font-semibold`, `font-bold`).
- **Layout**: Clean grid structures, generous padding, and consistent spacing to ensure visual hierarchy.

---

## 2. Public Pages (No Login Required)

The public section is fully responsive, optimized for mobile usage, and lets students and lecturers find classrooms in real-time.

### 2.1 Search Page (`/` or `/search`)
- **Layout**: Mobile-first, centered, distraction-free search card.
- **Form Controls**:
  - **Day of the Week** (Dropdown: Monday to Sunday). Defaults to the current day.
  - **Start Time** (Time Selector, e.g., `08:00`).
  - **End Time** (Time Selector, e.g., `10:00`).
  - **Capacity** (Number Input, Optional - minimum capacity).
  - **Room Type** (Dropdown, Optional - e.g., "Lecture Hall", "Computer Lab", "Seminar Room").
- **Search Button**: Prominent Royal Blue button.

### 2.2 Results Page (`/results`)
- **Layout**: List/Grid of room cards, displaying the search query header at the top (with a quick "Modify Search" button).
- **Room Card Details**:
  - Room Name & Floor/Location
  - Building Name
  - Room Type (Badge)
  - Capacity (Badge with icon)
  - Status indicator ("Available")
- **Sorting / Filtering**: Simple quick-filter by building or sorting by capacity.

### 2.3 Empty States
- Shown when no rooms match the requested time slots or filters.
- **Design**: Minimalist visual (using Lucide icons, e.g., `Inbox` or `SearchCode`), a friendly descriptive message (e.g., "All classrooms are currently booked for this time slot. Try adjusting your time filters or searching a different day"), and a clear button to "Reset Filters" or "Go Back".

---

## 3. Admin Pages (Authentication Required)

The administrator dashboard is optimized for desktop (data-dense) to facilitate rapid campus and academic management.

### 3.1 Login Page (`/admin/login`)
- **Layout**: Centered, clean box layout on a Slate background.
- **Controls**: Username & Password inputs, Royal Blue submit button.
- **Features**: Error messages displayed in red alert boxes if authentication fails.

### 3.2 Main Admin Layout (Persistent Sidebar)
- **Design**:
  - Sidebar: Deep Blue (`bg-blue-900`) containing logo, current admin identity, and links to all admin modules.
  - Active links are highlighted in Royal Blue (`bg-blue-600` or slate-800 accents).
  - Header: Shows page title, current logged-in user, and a Logout button.

### 3.3 Dashboard (Stats) (`/admin/dashboard`)
- **Widgets**:
  - Total Rooms & Total Buildings counts.
  - Active Timetable Entries count.
  - Total Administrators list/count.
  - **Real-Time Room Utilization Chart**: Visual representation of current occupancy.

### 3.4 Campus Management (`/admin/campus`)
- **Layout**: Tabs to switch between:
  - **Buildings Tab**: List of buildings, add/edit/delete buildings forms.
  - **Rooms Tab**: Table listing classrooms, building relationship, capacity, room type, and action controls (Edit/Delete).
- **Design**: Clean tables with thin borders, light grey header, hover rows, and concise action buttons.

### 3.5 Academics Management (`/admin/academics`)
- **Layout**: Tabs to switch between:
  - **Schools Tab**: CRUD operations for departments/schools (e.g., School of Computing).
  - **Courses Tab**: CRUD operations for degree programs with school dropdown.
  - **Student Groups Tab**: CRUD operations for group codes (e.g., BCS-3A) with course dropdown.
  - **Lecturers Tab**: CRUD operations for lecturers (Name, Email).

### 3.6 Timetable Management (`/admin/timetable`)
- **Layout**:
  - **List Pane**: Table showing all scheduled entries (Day, Time range, Course, Lecturer, Group, Room, Building). Includes pagination and filters by building or day.
  - **Conflict-Aware Creation Form**:
    - Selectors for Classroom, School, Course, Student Group, Lecturer, Day of Week, Start Time, and End Time.
    - Input for Unit Name.
    - **Real-time Validation & Feedback**: Frontend warns the admin of potential database constraint violations. If a backend validation fails, errors are clearly flagged.

### 3.7 Analytics Page (`/admin/analytics`)
- **Layout**: Analytics module showing usage data.
- **Metrics**:
  - **Room Utilization Rate**: Graph/percentage showing how many hours rooms are booked versus total available academic hours.
  - **Most Booked Rooms**: List of top rooms with the highest booking counts.
  - **Busy Hours**: Chart showing peak timetable overlaps (e.g., 10:00 AM - 12:00 PM).
  - **Usage by Room Type**: Comparison of labs vs. lecture halls.

### 3.8 Settings Page (`/admin/settings`)
- **Access Restrictions**:
  - Account Creation/Revocation section is **visible only to Super Admins** (i.e. `is_super_admin === 1` or `true`).
- **Super Admin Operations**:
  - Create standard Admin Account (Fields: Username, Password, Retype Password).
  - List of Admin Accounts with a "Revoke" (Delete) button next to regular admins. (Super Admin cannot delete themselves).
- **Personal Operations (All Admins)**:
  - Update Password (Fields: Current Password, New Password, Confirm New Password).

---

## 4. State Management Strategy

We will use React Context for lightweight and performant state management.

### 4.1 AuthContext (`/src/context/AuthContext.js`)
- **State Properties**:
  - `user`: Object containing `username`, `isSuperAdmin` (boolean), or `null` if unauthenticated.
  - `token`: JWT token string (persisted in `localStorage` / cookies).
  - `loading`: Boolean state to prevent flash of unauthenticated screens on reload.
- **Methods**:
  - `login(username, password)`: Sends request to backend `/api/admin/login`, saves JWT, and updates user state.
  - `logout()`: Clears credentials and redirects to public pages.
  - `checkAuth()`: Verifies token status against backend or validates local storage token on mount.
- **Security Check**:
  - Auto-injection of JWT in Axios/fetch HTTP headers (`Authorization: Bearer <token>`) for all admin routes.
