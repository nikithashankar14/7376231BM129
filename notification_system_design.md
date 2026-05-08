# Notification System Design

## Overview
This frontend solution is built as a responsive React application that displays:
- **All notifications** fetched from the provided API
- A **Priority Inbox** showing the top `n` notifications ranked by importance and recency

The UI supports filtering by notification type and lets the user mark notifications as viewed.

## Priority logic
Priority is determined by a combination of:
- **Weight by type**: `Placement > Result > Event`
- **Recency**: newer notifications are ranked higher

The notification score formula used:
- `score = weight * 100000 - ageSeconds`

This ensures that higher-weight notifications stay above lower-weight notifications, while still preferring newer items when types are equal.

## Notification types and weights
- `Placement` → weight 3
- `Result` → weight 2
- `Event` → weight 1

## Efficient top-n maintenance
The app maintains the top `n` notifications in the browser by:
1. fetching up to 100 notifications from the API
2. filtering by type if requested
3. sorting the notifications by score descending
4. slicing the first `n` items for the Priority Inbox

This approach is efficient for the UI because it avoids unnecessary sorting beyond the visible top set and keeps the app responsive.

## API integration
- Uses the provided `http://4.224.186.213/evaluation-service/notifications` endpoint
- Supports query parameters:
  - `limit`
  - `page`
  - `notification_type`
- Includes an optional **Bearer token** input so a protected route can be used if the evaluation server requires authorization

## User experience
- Displays both new and viewed notifications
- Newly fetched notifications are highlighted as `New`
- Clicking a notification marks it as viewed
- Viewed state is persisted in `localStorage`
- The interface is responsive and works on mobile and desktop widths

## Notes for submission
- This is a React frontend implementation using **Vanilla CSS**
- It follows the placement task requirement by focusing on notification prioritization and modern UI workflow
- The `notification_system_design.md` file documents the solution approach clearly
