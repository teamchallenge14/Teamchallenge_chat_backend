# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project adheres to Semantic Versioning.

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
