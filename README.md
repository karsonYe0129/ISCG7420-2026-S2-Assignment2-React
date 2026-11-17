# Piki Ora React Appointment Portal

ISCG7420 Assignment 2 frontend. Django REST Framework companion repository:
https://github.com/karsonYe0129/ISCG7420-2026-S2-Assignment2-DRF

Live portal: https://piki-ora-a2.onrender.com/

## Local development

Node 22 recommended.

```bash
npm ci
npm start
```

The default API is http://127.0.0.1:8000/api. Set REACT_APP_API_URL in .env.local
and restart/rebuild to change it. Only public API locations belong in React
configuration; never put database credentials or administrator passwords there.

## Checks and deployment

```bash
CI=true npm test -- --watchAll=false --runInBand
CI=true npm run build
```

Six interaction tests cover sign-in, errors, registration inputs, visitor access,
empty bookings and cancelled bookings. Render static site build: npm ci && npm run build.
Publish directory: build. Rewrite /* to /index.html for client-side routing.

Patients can browse, book, reschedule and cancel. Staff use a custom React dashboard
for doctor, consultation slot, booking and patient management. Axios sends DRF tokens
from sessionStorage in the Authorization header. Confirmation is in the portal;
email/SMS delivery is not implemented.

## Provenance and assistance

Starting point: lecturer's React tutorial, with original screens replaced:
https://github.com/songlei1979/iscg7420-2026-s2-react-tutorial
OpenAI Codex provided substantial implementation, testing and deployment assistance.
This is a public code-only snapshot. The deployed site remains connected to the
original integrated project repository. No reports or credentials are included.
