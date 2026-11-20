# Personal Learning Journey Tracker

A beginner MERN stack learning project for keeping track of learning goals and daily progress. The frontend uses React and Vite. The backend uses Node.js and Express. Data is stored in JSON files in `backend/data` so the project can be understood without setting up a database.

## Features

- Register and log in
- Create and manage goals, subjects, tasks, learning sessions and notes
- Attach, open, download and remove a small PDF file from a note
- View learning activity in the calendar and reports
- Keep each user's records protected by a login token

## Requirements

- Node.js (with npm)

## Start the project

1. Open a terminal in `backend` and install packages:

   ```bash
   npm install
   ```

2. Create `backend/.env` with these values. Use a private, long random value for `JWT_SECRET`:

   ```env
   PORT=5000
   JWT_SECRET=replace-this-with-a-long-random-secret
   ```

3. Start the backend from the `backend` folder:

   ```bash
   npm run dev
   ```

4. Open a second terminal in `frontend`, install packages and start the frontend:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local address printed by Vite in your browser and register an account.

## Documentation

- [PROJECT_DETAILS.md](file:///d:/coding/project/personal-learning-journey-tracker/PROJECT_DETAILS.md): Comprehensive system architecture, schema definitions, API specifications, and code inventory.
- [STUDENT_WORKFLOW_GUIDE.md](file:///d:/coding/project/personal-learning-journey-tracker/STUDENT_WORKFLOW_GUIDE.md): Student-friendly workflow walkthrough, concept clarifications (lessons vs. study sessions), relational integrity patterns, report analytics, and testing checklist.

## Check the project

From `backend`, run tests:
```bash
npm test
```

From `frontend`, run lint and production build:
```bash
npm run lint
npm run build
```

From `backend`, run `npm test` for the small API checks.

## Notes about data

The app writes user records to the JSON files in `backend/data`. Keep these files when you want to retain your data. PDF attachments are stored as text inside `notes.json`; the app allows PDF files smaller than 5 MB. This simple storage is suitable for learning and local use.
