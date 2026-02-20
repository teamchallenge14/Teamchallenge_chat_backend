# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project adheres to Semantic Versioning.

## [0.0.16] - 2026-02-18

### Added

- POST `/v1/rooms/:id/report` endpoint for room reports (members only)
- Report room DTO with `reason` and optional `details`
- RoomReport model and repository helpers for storing reports
- Email notification with report details sent to system mailbox
- Rate limiting for room reports (max 3 per hour per user)

## [0.0.15] - 2026-02-17

### Added
 - Guest user registration



## [0.0.15] - 2026-02-17

### Added

- Rooms list now returns only rooms where the user is a member or owner
- Rooms list items now include members with basic user data and role

### Changed

## [0.0.13] - 2026-02-11

### Changed

- user age(int) changed to birthDate (DateTime)

## [0.0.14] - 2026-02-17

### Added

- GET `/v1/rooms` endpoint for rooms list with pagination and sorting by members count
- Rooms list query DTO (`page`, `limit`, `sort`, `order`)
- Rooms list response DTOs: `RoomListItemDto` and `PaginatedRoomsDto`
- Swagger docs for rooms list

### Changed

- Rooms repository now supports paginated list retrieval with members count

## [0.0.12] - 2026-02-04

### Added

- Room models and relations (Room, RoomMember, RoomInterest) with enums (RoomType, RoomStatus, RoomMemberRole, RoomLanguage)
- POST `/v1/rooms` endpoint for room creation
- Room creation logic: owner assignment, auto member add, optional interests, languages enum, age range 12-100
- Rooms swagger docs moved to `rooms/swagger-docs`

## [0.0.13] - 2026-02-07

### Added

- Room creation now supports uploading a single room photo (image only, max 10MB) in the same request
- Room photo metadata is stored in a new `Media` table linked to the room
- `photoUrl` field is populated with the uploaded image URL for quick preview usage
- GET `/v1/rooms/:id` endpoint with member-only access checks
- Room details response includes members with minimal user fields and role
- Swagger docs for room retrieval

### Changed

- Room response DTOs moved to `rooms/dto/responses` with barrel export
- Room responses no longer include `ownerId`

## [0.0.11] - 2026-01-30

### Changed

- put users interest replaced with path also changed answers and no longer does replaced

## [0.0.10] - 2026-01-29

### Changed

- `user/delete` updated response

### Added

- Added users interests delete and add route

## [0.0.9] - 2026-01-29

### Changed

- `/interests` updated paths ,add /v1/ prefix

### Added

- `global` added Api Bearer to docs (where needed)

- `errors` added global error pattern like
  {
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Validation failed (uuid is expected)",
  "path": "/v1/users/sd",
  "timestamp": "2026-01-29T10:48:25.213Z"
  }

## [0.0.8] - 2026-01-28

### Changed

- `/auth/refresh` no longer returns the `user` object.
- The endpoint now returns **only `accessToken`**.
- User data should be obtained from client state or a separate `/me` endpoint.

## [0.0.7] - 2026-01-28

### Added

- Bearer token verification for authenticated requests
- Access token is now returned in the response body for `POST /auth/refresh`
- Access token is now returned in the response body for `POST /auth/`
- Access token is now returned in the response body for `POST /auth/login`

### Changed

-
- Bearer token authentication now works in parallel with cookie-based authentication

### Deprecated

- Access token stored in cookies (cookie-based access token authentication will be removed in a future release)
