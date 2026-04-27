# UI Guidelines

## Role & Tech Stack

Act as an expert Frontend Developer using Next.js and Tailwind CSS. We are building a modern Dashboard UI.

---

## Design System & Aesthetic Rules

Please apply the following minimalist, clean, and modern design principles to all generated components and pages:

### Global Background
- Use `bg-slate-50` or `bg-gray-50` for the main layout background.
- Avoid pure white (`bg-white`) for the root body.

### Cards & Containers
- Use `bg-white` for content cards.
- Apply rounded corners: `rounded-xl` or `rounded-2xl`.
- Use soft shadows (`shadow-sm` or `shadow-md`) to create depth.
- If using borders, make them very subtle: `border border-gray-100`.

### Typography & Hierarchy
- **Primary Headings:** Dark and readable (`text-slate-800` or `text-gray-900`), use `font-semibold`.
- **Secondary / Subtext:** Lighter to reduce clutter (`text-gray-400` or `text-gray-500`), e.g., for timestamps or table headers.

### Buttons & Badges
- Use soft-tinted backgrounds for secondary actions or statuses.
  - ✅ `bg-green-50 text-green-600` instead of solid green.

### Micro-Interactions & Animations *(Keep it subtle!)*
- All interactive elements must have smooth transitions: `transition-all duration-300 ease-out`.
- Hover effects for clickable cards: subtle lift → `hover:-translate-y-1 hover:shadow-md`.
- Click effects for buttons: small scale down → `active:scale-95`.

---

## Task

> [ใส่สิ่งที่คุณต้องการให้ทำตรงนี้ เช่น Refactor the 'Internships' page to follow these exact design rules.]
