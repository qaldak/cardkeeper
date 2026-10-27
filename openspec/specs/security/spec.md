# Security Specification

## Purpose
Hardening of responses and downloads: security headers, protection against cross-site write requests and restriction of the hosts that images are loaded from. Sign-in and ownership rights are in `users-access`. HTTPS, HSTS and a content security policy are left to the reverse proxy. Decision: [ADR 0021](../../../docs/adr/0021-security-headers-and-cross-site-protection.md).

## Requirements

### Requirement: Security headers on every response
The system SHALL deliver every response (pages, API, images) with `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: same-origin`.
Source: README (7f3d955) §Users (safeguards); code app/nuxt.config.ts (routeRules); User instruction 2026-10-21 14:27 (review assignment) | Origin: derived

#### Scenario: Headers on page and API
- GIVEN the app is running
- WHEN the sign-in page and `GET /api/health` are requested
- THEN both responses carry the three headers

### Requirement: Cross-site write requests are rejected
The system SHALL reject requests with POST, PUT, PATCH or DELETE to `/api/` that the browser marks with `Sec-Fetch-Site: cross-site` or `same-site` with 403 `cross_site_request`; `same-origin`, `none`, a missing header and read access stay allowed.
Source: README (7f3d955) §Users (safeguards); code server/lib/cross-site.ts; test cross-site.test.ts; User instruction 2026-10-21 14:27 | Origin: derived

#### Scenario: Foreign page
- GIVEN a request carries `Sec-Fetch-Site: cross-site`
- WHEN it is sent as POST to `/api/auth/login`
- THEN the system answers with 403 `cross_site_request`

#### Scenario: Own page and scripts
- GIVEN `Sec-Fetch-Site: same-origin` or no header
- WHEN a POST is sent
- THEN it is processed as usual

#### Scenario: Reading
- GIVEN `Sec-Fetch-Site: cross-site`
- WHEN a GET is sent
- THEN it is not rejected

### Requirement: Images only from allowed hosts
The system SHALL load images from card databases only over HTTPS and only from the hosts that the adapter of the game declares, with a limited file size, so that manipulated answers cannot make it fetch arbitrary addresses.
Source: Code server/lib/image-download.ts, server/lib/image-url.ts; README (7f3d955) §Notes on the card API; test image-download.test.ts | Origin: derived

#### Scenario: Foreign host
- GIVEN an answer names an image URL on a host that is not declared
- WHEN the system is to load the image
- THEN it loads nothing and the card is created without an API image

#### Scenario: http instead of https
- GIVEN an image URL starts with `http:`
- WHEN the system checks it
- THEN it is not used

### Requirement: File paths stay in the image directory
The system SHALL keep stored image paths relative to the image directory and reject every path that leaves it.
Source: Code server/lib/image-files.ts (resolveImagePath); test image-files.test.ts | Origin: derived

#### Scenario: Path with `..`
- GIVEN a stored path resolves outside the image directory
- WHEN the system is to deliver the file
- THEN it throws an error and delivers nothing
