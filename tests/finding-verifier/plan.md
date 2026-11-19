# Plan: move the orders database to the Frankfurt region

Fixture for the `finding-verifier` cases. An invented plan with planted flaws; not a real system.

## 1. Purpose

Move the orders database (PostgreSQL 15, 410 GB) from the Dublin region to the Frankfurt region so that order data for German customers is stored in Germany, as the contract with the retail client requires from 1 March. The move must not lose any order and must keep the shop closed for orders for no more than 30 minutes.

## 2. Scope

In scope: the orders database, its two read replicas, and the connection settings of the four services that use it (checkout, invoicing, warehouse, reporting).

Out of scope: the product catalogue database, the search index, and the mobile apps. The mobile apps reach the database only through the checkout service.

## 3. Approach

1. Create the new database in Frankfurt from last night's snapshot.
2. Start logical replication from Dublin to Frankfurt and let it catch up.
3. On the night of the move, put the shop in maintenance mode at 02:00.
4. Wait until replication lag is zero, then stop replication.
5. Point the four services at Frankfurt by changing the `ORDERS_DB_URL` setting and restarting them.
6. Take the shop out of maintenance mode.
7. Delete the Dublin database the same night to stop paying for it.

We chose logical replication over a dump and restore on purpose: a dump and restore of 410 GB took 3 hours 40 minutes in the rehearsal, which is far over the 30-minute limit. Logical replication keeps the closed window to the switch itself.

## 4. Checks before the switch

- Row counts for the `orders`, `order_lines`, and `payments` tables match between Dublin and Frankfurt.
- The newest `orders.created_at` value is the same on both sides.
- Sequences are copied by hand with `setval`, because logical replication does not carry sequence values.

## 5. Rollback

If the checks in section 4 fail, or a service cannot connect after step 5, set `ORDERS_DB_URL` back to Dublin, restart the services, and leave maintenance mode. Rollback is possible until step 6. After step 6 new orders exist only in Frankfurt, so going back would lose them.

## 6. Security

- The Frankfurt database accepts connections only from the private network of the four services.
- Passwords are stored in the secrets manager; the plan does not rotate them, because the same service accounts are reused.
- Data is encrypted at rest with the provider's default key.
- During replication, traffic between Dublin and Frankfurt goes over the public internet without TLS, because the private link between the regions is not ordered yet.

## 7. People and timing

- Move night: Saturday 14 February, 02:00–02:30.
- Carrying out the plan: Olena (database), Tomasz (services).
- The rehearsal ran on 20 January against a 40 GB copy of the database.
- Approval to start: the head of engineering, by message, on the evening before.

## 8. Cost

The Frankfurt database costs 2,150 EUR a month, against 1,900 EUR in Dublin. Both run in parallel for about three weeks, so the one-time extra cost is about 1,425 EUR.

## 9. After the move

- Watch error rates of the four services for 24 hours.
- Update the runbook and the architecture diagram within one week.
- The reporting service reads from a replica; its two replicas are rebuilt in Frankfurt in the week after the move, and until then reporting reads from the primary.
