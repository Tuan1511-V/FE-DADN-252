# FE-DADN-252 Fullstack Branch

This branch adds a mock backend and connects the existing frontend dashboard to API data.

## What was added

- Added `backend/` Express server
- Added mock API mode so the project can run without PostgreSQL
- Added mock dashboard data for sensors, devices, logs, and alerts
- Connected frontend UI to backend APIs
- Added device toggle actions from frontend to backend
- Kept the existing frontend layout and visual design

## Project Structure

```text
FE-DADN-252/
  src/
  backend/
Frontend
Tech stack:

React
TypeScript
Vite
Tailwind CSS
Run frontend:

bash

npm install
npm run dev
Frontend URL:

http://localhost:3000
Backend
Tech stack:

Node.js
Express
Run backend:

bash

cd backend
npm install
node src/server.js
Backend URL:

http://localhost:4000
Notes
Backend currently supports mock mode for demo/testing
No PostgreSQL setup is required for the current branch demo
Adafruit integration is not required yet
Frontend calls backend through API integration added in this branch
Main changes in this branch
Added backend folder and API routes
Added mock data store
Updated frontend to fetch dashboard data from backend
Updated frontend to send device commands to backend
Added environment config for local frontend/backend connection
