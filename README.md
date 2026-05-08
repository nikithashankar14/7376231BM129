# Notification App Frontend

A responsive React application that displays campus notifications and prioritizes the top `n` unread items based on type and recency.

## Key features

- Priority inbox with top `n` notifications
- Notification type filter: `All`, `Placement`, `Result`, `Event`
- Protected API support via Bearer token input
- Viewed notification tracking persisted in `localStorage`
- Responsive layout for desktop and mobile

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm start
```

3. Open in browser:

```text
http://localhost:3000
```

## Production build

```bash
npm run build
```

The optimized production-ready files are generated in the `build/` folder.

## Notes

- This app is a frontend implementation for the placement notification task.
- It fetches notifications from `http://4.224.186.213/evaluation-service/notifications` and supports query parameter filtering.
- The design rationale is documented in `notification_system_design.md`.
