# Security Specification — Dapur Aziz Firestore Rules

## Data Invariants
1. **PII Isolation**: User profile documents (`/profiles/{userId}`) containing `email`, `no_hp`, and `alamat` are readable only by the document owner (`request.auth.uid == userId`) or a verified admin. Listing `/profiles` is strictly restricted to admins.
2. **No Self-Assigned Privilege Escalation**: Regular users registering or creating their profile can only assign `role: "user"` and cannot mutate `role` during profile updates. Only an existing/bootstrapped verified admin can assign or modify `role` or write to `/admins/{userId}`.
3. **Catalog Integrity**: Only verified admins can create, update, or delete menu items in `/products/{productId}`. Guests and customers have read-only access to the menu catalog.
4. **Order Ownership & State Integrity**: Customers can only create orders for themselves (`user_id == request.auth.uid`) with initial status `"Menunggu Konfirmasi"`. Once an order reaches `"Dimasak"`, `"Selesai"`, or `"Dibatalkan"`, customers cannot modify it; only verified admins can transition order statuses.
5. **Relational Atomicity**: Every `/orders/{orderId}/order_items/{itemId}` write requires the parent `/orders/{orderId}` document to exist in the same batch (`getAfter`) with matching `user_id == request.auth.uid`.

## Dirty Dozen Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Profile Read**: `GET /profiles/user_1` with `auth == null`.
2. **Cross-User PII Read**: `GET /profiles/user_2` signed in as `user_1`.
3. **Privilege Escalation on Create**: `CREATE /profiles/user_1` with `{ role: "admin" }` as non-admin user.
4. **Privilege Escalation on Update**: `UPDATE /profiles/user_1` changing `role` from `"user"` to `"admin"`.
5. **Shadow Field Injection**: `CREATE /orders/ord_1` containing an extra undeclared field `{ isPaid: true }`.
6. **Spoofed Unverified Email Admin**: `WRITE /products/prod_1` with `email: "zizdipanggilnengok@gmail.com"` and `email_verified: false`.
7. **Unauthorized Menu Mutation**: `CREATE /products/prod_1` signed in as regular `'user'`.
8. **Order Identity Spoofing**: `CREATE /orders/ord_1` with `{ user_id: "victim_uid" }` signed in as `attacker_uid`.
9. **Order Status Shortcutting**: `CREATE /orders/ord_1` with `{ status_pesanan: "Selesai" }`.
10. **Terminal State Tampering**: `UPDATE /orders/ord_1` by owner changing status after admin already set `"Dimasak"` or `"Selesai"`.
11. **Path ID Poisoning**: `CREATE /products/<1500-char string>` exceeding 128-char ID limit or containing invalid characters.
12. **Blanket Order List Scraping**: `LIST /orders` without `where('user_id', '==', uid)` as a non-admin user.
