# ToyKart Implementation Roadmap

This document describes what we should implement next, in execution order, with enough detail to start building immediately.

## How To Use This Document

- Build in order: `Now` -> `Next` -> `Then`.
- Each item includes target outcomes, backend tasks, frontend tasks, and acceptance criteria.
- When a section is complete, move to the next one.

---

## Phase 1: Implement Now (Core Commerce Completion)

### 1) Implement full order lifecycle (first)

#### Outcome
Customers and admins can track and manage an order from placement to delivery/cancellation.

#### Backend implementation
- Add order detail endpoint for customer:
  - `GET /api/orders/:id` (owner-only).
- Add customer actions:
  - `PATCH /api/orders/:id/cancel` (allowed only before fulfillment).
- Add admin order APIs:
  - `GET /api/admin/orders`
  - `GET /api/admin/orders/:id`
  - `PATCH /api/admin/orders/:id/status`
- Introduce order status model (example):
  - `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`.
- Record status transition timestamps and actor info (customer/admin).
- Add guardrails for invalid transitions (e.g., cannot move from `delivered` to `pending`).

#### Frontend implementation
- Customer:
  - Add Order Details page from `My Orders` list.
  - Show full items, shipping address, payment status, fulfillment timeline.
  - Add cancel button when status allows.
- Admin:
  - Create Order Management screens in admin panel.
  - Allow filtering by status/date/customer.
  - Add status update controls with confirmation.

#### Acceptance criteria
- Customer can open any own order by id and see full details.
- Customer can cancel only eligible orders.
- Admin can list and update order statuses.
- Invalid status transition requests return clear 4xx errors.

---

### 2) Implement real product search and catalog discovery

#### Outcome
Search bar and catalog browsing work as expected with query, sorting, and pagination.

#### Backend implementation
- Expand `GET /api/products` query capabilities:
  - `keyword`, `category`, `minPrice`, `maxPrice`, `ageGroup`, `brand`, `sort`, `page`, `limit`.
- Return paginated shape:
  - `items`, `page`, `pages`, `total`.
- Ensure stable sort defaults (e.g., featured then newest).
- Add indexes where needed for frequent filters.

#### Frontend implementation
- Wire header search form to route query params (e.g., `/?q=...`).
- Update home/catalog page to request products using query params.
- Add UI controls:
  - sort dropdown,
  - filter drawer/panel,
  - pagination controls,
  - clear filters.
- Keep URL in sync with active filters.

#### Acceptance criteria
- Typing and submitting search updates product results.
- Filters and sorting are reflected in URL and survive refresh.
- Pagination returns deterministic results.

---

### 3) Implement server-backed review system

#### Outcome
Reviews are persistent across devices and tied to products/users.

#### Backend implementation
- Create `Review` model with:
  - `product`, `user`, `rating`, `title`, `body`, `isApproved`, timestamps.
- Add endpoints:
  - `GET /api/products/:id/reviews`
  - `POST /api/products/:id/reviews` (auth required)
  - `DELETE /api/reviews/:id` (owner/admin rule)
- Update product aggregates (`rating`, `numReviews`) on review create/delete/update.
- Prevent duplicate review per user per product (if desired policy).

#### Frontend implementation
- Replace localStorage review logic with API calls.
- Show loading/error/empty states for reviews list.
- Allow logged-in users to submit review.
- If not logged in, show CTA to login.

#### Acceptance criteria
- New review appears after submit and persists across sessions/devices.
- Product rating and review count update correctly.
- Unauthorized submission is blocked with clear message.

---

### 4) Replace placeholder pages and links with real content

#### Outcome
Header/footer navigation points to real, useful pages.

#### Implementation
- Add pages/routes for:
  - Shipping Policy,
  - Returns & Refunds,
  - Contact,
  - Terms/Privacy (if needed now).
- Replace all `href="#"` placeholders with real routes.

#### Acceptance criteria
- No dead links in primary nav/footer.
- Policy pages are accessible and render correctly on desktop/mobile.

---

## Phase 2: Implement Next (Revenue + User Experience)

### 5) Implement payment gateway flow (online payments)

#### Outcome
Users can pay online, and payment status is verified server-side.

#### Backend implementation
- Integrate chosen gateway (provider-specific adapter).
- Add payment intent/session endpoint.
- Add secure webhook endpoint for payment confirmation.
- Update order `isPaid`, `paidAt`, transaction reference.
- Add idempotency protection for webhook handling.

#### Frontend implementation
- Add payment method selector at checkout (`COD` + online option).
- Redirect/embedded payment UI depending on provider.
- Show success/failure states and retry guidance.

#### Acceptance criteria
- Successful payment marks order paid.
- Failed/cancelled payment does not mark order paid.
- Webhook duplicate events do not duplicate updates.

---

### 6) Implement persistent wishlist and compare

#### Outcome
Wishlist/compare are account features, not device-local only.

#### Backend implementation
- Add user-linked storage for wishlist and compare list.
- Add endpoints:
  - `GET/POST/DELETE /api/wishlist`
  - `GET/POST/DELETE /api/compare`

#### Frontend implementation
- Build Wishlist page and Compare page.
- Sync icon/button states with server responses.
- Optional: keep local fallback for anonymous visitors and merge on login.

#### Acceptance criteria
- Wishlist and compare survive logout/login and device change.
- Add/remove actions reflect immediately in UI.

---

### 7) Implement customer account management

#### Outcome
Users can manage profile and saved address data.

#### Backend implementation
- Add profile update endpoint (`name`, `phone`, password change).
- Add address book endpoints (CRUD).

#### Frontend implementation
- Add account area pages:
  - Profile,
  - Addresses,
  - Security.
- Add forms with validation and success/error feedback.

#### Acceptance criteria
- User can update profile and see data persist.
- Checkout can prefill from default saved address.

---

## Phase 3: Implement Then (Admin and Scale)

### 8) Expand admin modules

#### Outcome
Admin can operate store end-to-end.

#### Implementation
- Add admin resources for:
  - Orders,
  - Users,
  - Reviews moderation,
  - Promotions/coupons.
- Add dashboard metrics:
  - total orders,
  - paid revenue,
  - top products,
  - low-stock alerts.

#### Acceptance criteria
- Admin can complete key operational workflows without direct DB access.

---

### 9) Add tests and quality gates

#### Outcome
Changes are safer and regressions are caught early.

#### Implementation
- Add test scripts in root/client/server.
- Backend: unit + integration tests for critical APIs.
- Frontend: component + flow tests for checkout/search/order actions.
- Add CI pipeline to run tests on push/PR.

#### Acceptance criteria
- CI fails on test failures.
- Core commerce flows have reliable automated coverage.

---

## Suggested Immediate Sprint Breakdown

### Sprint A
- Order lifecycle APIs + customer order details page.
- Admin order list/status update screens.

### Sprint B
- Search/filter/pagination backend + storefront wiring.

### Sprint C
- Server-backed reviews (model + APIs + UI replacement).

### Sprint D
- Policy pages + dead-link cleanup.

---

## Definition of Done (Global)

A roadmap item is done when:
- Backend endpoints are implemented with validation and authorization.
- Frontend flow is fully wired and handles loading/error/empty states.
- Manual QA checklist passes for desktop and mobile.
- Documentation is updated for routes, payloads, and behavior.
