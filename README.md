# Real-Time Collaborative Spreadsheet

This project is a lightweight web-based spreadsheet that allows multiple users to edit the same document simultaneously.  
The main focus of this project was implementing **real-time synchronization and collaborative presence** while keeping the system simple.

The application is built using **Next.js, TypeScript, Firebase Firestore, and Tailwind CSS**.

**Live Demo:**  
https://spreadsheet-nine-ashy.vercel.app

---

## Features

### Spreadsheet Grid
The editor renders a grid of **26 columns (A–Z) and 30 rows**.  
Cells can be edited directly and support keyboard navigation using arrow keys, Enter, and Tab.

### Formula Support
Cells can contain formulas referencing other cells.

Example:

```
A1 = 1
A2 = 2
A3 = =A1+A2
```

Formulas are evaluated on the client and recomputed when referenced cells change.

### Real-Time Collaboration
Multiple users can open the same spreadsheet and see updates instantly.  
This is implemented using **Firestore snapshot listeners**, which notify all connected clients when the document changes.

### Presence System
The spreadsheet displays currently active users.

Each client registers a **session ID** and periodically updates a `lastActive` timestamp.  
Users are removed from the active list if they stop sending heartbeat updates.

### Authentication
Users can optionally sign in using **Google Authentication** via Firebase.  
Signed-in users appear in the presence list with their display name and avatar.

### Dashboard
The dashboard shows all spreadsheets stored in Firestore.  
It updates automatically when documents are created or renamed.

---

## Architecture Overview

The system keeps spreadsheet data in **local React state** for fast UI interaction.  
Firestore acts as the **shared source of truth** between clients.

Typical update flow:

```
User edits cell
↓
Local state updates immediately
↓
Debounced write to Firestore
↓
Firestore document updates
↓
Snapshot listeners notify other clients
↓
Other clients update their UI
```

This approach keeps the interface responsive while maintaining synchronization between users.

---

## Data Model

### Spreadsheet Document

```
documents/{docId}
{
  title: string,
  cells: {
    "A1": "10",
    "A2": "=A1+A2"
  },
  updatedAt: timestamp
}
```

Cells are stored as a simple key-value map where the key is the cell ID.

---

### Presence Document

```
presence/{docId}
{
  users: {
    sessionId: {
      name,
      color,
      lastActive
    }
  }
}
```

Each connected tab writes its presence information and periodically updates `lastActive`.

---

## Key Components

**firebase.ts**  
Initializes Firebase and exports Firestore and Authentication instances.

**SpreadsheetGrid.tsx**  
Handles spreadsheet state, real-time synchronization with Firestore, keyboard navigation, and formula rendering.

**PresenceBar.tsx**  
Tracks active users using Firestore presence documents and heartbeat updates.

---

## Running Locally

Install dependencies:

```
npm install
```

Create a `.env.local` file with Firebase configuration variables.

Start the development server:

```
npm run dev
```

Then open:

```
http://localhost:3000
```

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Firebase Firestore
- Firebase Authentication
- Vercel (deployment)
