# URL Shortener API

A REST API for shortening long URLs, with optional custom slugs, optional password
protection, and per-click analytics (IP, user agent, referrer, timestamp).

Built with **Node.js**, **Express**, and **MongoDB (Mongoose)**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [1. Create a Short URL](#1-create-a-short-url)
  - [2. Redirect to Original URL](#2-redirect-to-original-url)
  - [3. Get Click Analytics](#3-get-click-analytics)
  - [4. Health Check](#4-health-check)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Known Limitations](#known-limitations)

---

## Features

- Shorten any valid URL to a compact `nanoid`-based slug (10 characters).
- Optional **custom slug** instead of an auto-generated one.
- Optional **password protection** on a link (hashed with bcrypt, never stored in plain text).
- Automatic **click tracking** — every redirect increments a counter and logs an analytics record.
- **Per-link analytics endpoint** returning total clicks and a full visitor log (IP, user agent, referrer, visit time).
- **Auto-expiry**: links and their analytics records are removed automatically via MongoDB TTL indexes.
- Centralized error handling middleware returning consistent JSON error responses.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Web framework | Express 5 |
| Database | MongoDB |
| ODM | Mongoose 9 |
| ID generation | nanoid |
| URL validation | is-url |
| Password hashing | bcrypt |
| Env config | dotenv |
| Dev tooling | nodemon |

## Project Structure

```
URL-Shortener-API/
├── src/
│   ├── controllers/
│   │   └── urlController.js      # Request/response handling for all routes
│   ├── db/
│   │   └── setupdb.js            # Mongoose connection setup
│   ├── middlewares/
│   │   └── globalErrorMiddleware.js  # Centralized error → JSON response
│   ├── models/
│   │   ├── urlSchema.js          # Mongoose schema for shortened URLs
│   │   └── analytics.js          # Mongoose schema for click/visit records
│   ├── routes/
│   │   └── urlRoutes.js          # Route definitions
│   ├── services/
│   │   └── urlService.js         # Core business logic (DB reads/writes)
│   ├── utils/
│   │   └── encryptPassword.js    # bcrypt password hashing helper
│   ├── validators/
│   │   └── validateUrl.js        # Middleware validating the submitted URL
│   └── server.js                 # App entry point
├── package.json
└── README.md
```

**Layering pattern**: `routes` → `controllers` (HTTP concerns) → `services` (business logic) → `models` (persistence). Validation and error handling are implemented as Express middleware.

## How It Works

1. **Shortening a URL**
   - Client submits the original URL (and optionally a custom slug / password).
   - The `isUrl` validator middleware rejects malformed URLs before they reach the controller.
   - The service checks whether a requested custom slug is already taken; if not supplied, it generates a random 10-character `nanoid` slug and re-checks uniqueness in a loop until a free one is found.
   - If a password was provided, it's hashed with bcrypt before being stored — the plain-text password is never persisted.
   - The new link document is saved with a default expiry of 24 hours from creation.

2. **Visiting a short URL**
   - The slug is looked up in the database.
   - If the link is password-protected, a password must be supplied and match the stored hash, or the request is rejected.
   - On success, an analytics entry is recorded (IP, user agent, referrer, timestamp) and the link's click counter is incremented.
   - The client is redirected (HTTP 302) to the original URL.

3. **Viewing analytics**
   - Looking up a link by its internal `customId` returns the total click count and the full list of recorded visits.
   - If the link is password-protected, the same password check applies before analytics are returned.

4. **Expiry**
   - Both the URL and analytics collections have a MongoDB TTL index on their expiry field, so MongoDB automatically deletes expired documents in the background — no manual cleanup job needed.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A running MongoDB instance (local or hosted, e.g. MongoDB Atlas)

### Installation

```bash
git clone https://github.com/Soban-Abbas/URL-Shortener-API.git
cd URL-Shortener-API
npm install
```

### Configuration

Create a `.env` file in the project root (see [Environment Variables](#environment-variables)).

### Run in development

```bash
npm run dev
```

The server starts on **`http://localhost:3000`**.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `url` | Yes | MongoDB connection string, e.g. `mongodb://localhost:27017/url-shortener` |

Example `.env`:

```
url=mongodb://localhost:27017/url-shortener
```

> **Note:** the connection string variable is named `url` (lowercase) in this codebase — not `MONGO_URI` or `DATABASE_URL`. Match it exactly, or update `src/db/setupdb.js` if you rename it.

## API Reference

Base URL: `http://localhost:3000`

### 1. Create a Short URL

Shortens a URL, optionally with a custom slug and/or password protection.

**Endpoint:** `POST /url`

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | Yes | The original URL to shorten. Must be a valid URL. |
| `customUrl` | string | No | A custom slug to use instead of an auto-generated one. |
| `password` | string | No | Password to protect the link with. |

**Request Example:**

```json
POST /url
Content-Type: application/json

{
  "url": "https://example.com/some/very/long/path",
  "customUrl": "my-link",
  "password": "secret123"
}
```

**Success Response — `201 Created`:**

```json
{
  "id": "V1StGXR8_Z5jdHi6B-myT",
  "originalUrl": "https://example.com/some/very/long/path",
  "shortUrl": "http://localhost:3000/my-link",
  "totalClicks": 0
}
```

**Error Responses:**

| Status | Condition | Body |
|---|---|---|
| `422` | `url` is missing or not a valid URL | `{ "error": "Invalid url" }` |
| `409` | Requested `customUrl` is already taken | `{ "error": "Custom Url not available" }` |
| `500` | Unexpected server/database error | `{ "error": "Internal Server Error" }` |

---

### 2. Redirect to Original URL

Visiting a short link redirects the caller to the original URL and logs the visit.

**Endpoint:** `GET /:shortUrl`

**Request Example:**

```
GET /my-link
```

If the link is password-protected, the password must be included in the request body:

```json
GET /my-link
Content-Type: application/json

{
  "password": "secret123"
}
```

**Success Response:** `302 Found` — redirects to the original URL.

**Error Responses:**

| Status | Condition | Body |
|---|---|---|
| `404` | No link matches the given slug | `{ "error": "No Such Url Exist please try something else" }` |
| `401` | Link is password-protected and no password was supplied | `{ "error": "url is password protected " }` |
| `401` | Password supplied does not match | `{ "error": "Wrong url or password" }` |

---

### 3. Get Click Analytics

Returns total click count and per-visit details for a shortened link.

**Endpoint:** `GET /analysis/:id`

`:id` is the internal `customId` returned when the link was created (the `id` field from the create response — **not** the short slug).

**Request Example:**

```
GET /analysis/V1StGXR8_Z5jdHi6B-myT
```

With a password-protected link:

```json
GET /analysis/V1StGXR8_Z5jdHi6B-myT
Content-Type: application/json

{
  "password": "secret123"
}
```

**Success Response — `200 OK`:**

```json
{
  "analysis": {
    "originalUrl": "https://example.com/some/very/long/path",
    "shortUrl": "my-link",
    "totalClicks": 3,
    "visitor": [
      {
        "ip": "127.0.0.1",
        "userAgent": "Mozilla/5.0 ...",
        "referrer": null,
        "visitedAt": "2026-08-01T10:15:32.000Z"
      }
    ]
  }
}
```

**Error Responses:**

| Status | Condition | Body |
|---|---|---|
| `404` | No link matches the given `id` | `{ "error": "Url Not Found" }` |
| `401` | Link is password-protected and no password was supplied | `{ "error": "Please enter password" }` |
| `401` | Password supplied does not match | `{ "error": "Wrong Url or password" }` |

---

### 4. Health Check

**Endpoint:** `GET /`

**Success Response — `200 OK`:**

```json
{
  "message": "wellcome to url shortner"
}
```

## Data Models

### `urls` collection

| Field | Type | Notes |
|---|---|---|
| `customId` | String | Unique internal ID used to fetch analytics |
| `originalUrl` | String | The full destination URL |
| `shortUrl` | String | The slug (custom or generated) |
| `password` | String \| null | bcrypt hash, or `null` if unprotected |
| `clickCount` | Number | Incremented on every successful visit |
| `expiresAt` | Date | TTL index — document is auto-deleted after this time |
| `createdAt` / `updatedAt` | Date | Added by Mongoose timestamps |

### `analytics` collection

| Field | Type | Notes |
|---|---|---|
| `urlId` | ObjectId | References the corresponding `urls` document |
| `expiryTime` | Date | TTL index — record auto-deleted after this time |
| `ip` | String | Visitor IP address |
| `userAgent` | String \| null | Visitor's user agent string |
| `referrer` | String \| null | HTTP referrer header, if present |
| `createdAt` | Date | Used as the visit timestamp |

## Error Handling

All errors flow through a single global error-handling middleware
(`src/middlewares/globalErrorMiddleware.js`), which returns a consistent shape:

```json
{
  "error": "<message>"
}
```

with the HTTP status code taken from the thrown error (defaulting to `500` if none is set).

## Known Limitations

- The redirect route (`GET /:shortUrl`) reads the password from the **request body**. Standard browser navigation (clicking a link, typing a URL) sends no body on a `GET` request, so password-protected links currently can't be unlocked through normal navigation — a password would need to be sent via a tool like `curl`/Postman, or the route changed to accept it as a query parameter.
- The default link expiry (24 hours) is currently hardcoded and not configurable per request.

