# Olive Branch Ministries - Daily Devotional App

A beautiful, interactive daily devotional web application built with React, Tailwind CSS, and Firebase.

## Features

- **Daily Devotionals:** A full year of inspirational content including scripture, reflections, prayers, and quotes.
- **Interactive Reader:** Smooth page transitions and a clean, focused reading interface.
- **Manual Page Selection:** Quickly jump to any day of the year via a month-based navigation grid.
- **Bookmarking:** Save your favorite devotions for easy access later.
- **Journaling:** Add personal notes to any day's entry. Content is saved securely via Firebase.
- **Bible Integration:** Integrated Bible viewer for deep-diving into scripture references.
- **PDF Export:** Download the entire devotional series as a beautifully formatted PDF.
- **User Authentication:** Secure login via Google Authentication.

## Tech Stack

- **Frontend:** React 18 with Vite
- **Styling:** Tailwind CSS
- **Animations:** Motion (formerly Framer Motion)
- **Database/Auth:** Firebase (Firestore & Authentication)
- **Icons:** Lucide React
- **PDF Generation:** jsPDF

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1. Clone the repository or download the source code.
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build

To create a production-ready build:
```bash
npm run build
```

## Project Structure

- `src/components/`: React components (Main Reader, Bible Viewer, Login).
- `src/data/`: Application data, including the `devotions.ts` content library.
- `src/context/`: React Context providers (Auth).
- `src/lib/`: Utility functions and third-party initializations (Firebase, error handlers).
- `src/types.ts`: TypeScript interfaces and type definitions.

---

*“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105*
