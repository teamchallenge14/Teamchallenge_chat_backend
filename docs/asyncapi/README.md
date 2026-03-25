# Socket AsyncAPI

Main contract file:

- `docs/asyncapi/socket.asyncapi.yaml`

How to view:

- AsyncAPI Studio (browser): open https://studio.asyncapi.com/ and drag-drop `socket.asyncapi.yaml`.
- Local HTML (optional):
  1. `npx @asyncapi/cli@latest render docs/asyncapi/socket.asyncapi.yaml @asyncapi/html-template -o docs/asyncapi/site`
  2. Open `docs/asyncapi/site/index.html` in browser.

Notes:

- This file documents current Socket.IO events implemented in `src/modules/socket`.
- Keep this file updated whenever event names/payloads/ack contracts change.

## What to listen to

`room:create` (client emit):

- success events:
  - `room:created` (room payload)
  - `room:joined` (creator auto-joined as `OWNER`)
- error events:
  - `ws:error` (`{ code, message }`, fallback/global)
- ack:
  - success: `{ ok: true, data: CreatedRoomPayload }`
  - error: `{ ok: false, message: string }`

`room:join` (client emit):

- success events:
  - `room:joined` (requesting user joined room)
  - `room:user_joined` (broadcast to other room members)
- error events:
  - `ws:error` (`{ code, message }`, fallback/global)
- ack:
  - success: `{ ok: true, data: RoomJoinedPayload }`
  - error: `{ ok: false, message: string }`

## Practical client strategy

- For request/response UX use `ack` as the primary mechanism.
- Keep one global `ws:error` listener for fallback and non-request-scoped errors.
- Success events (`room:created`, `room:joined`, `room:user_joined`) are still useful for broadcast-driven UI updates.
