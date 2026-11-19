## Summary
The orders list skips the first page of results.

## Steps to Reproduce
1. Start the service with the seed data (25 orders).
2. Request `GET /orders?page=1`.
3. The response starts at the 11th order.

## Expected Behavior
- Page 1 returns orders 1–10.
- Page 2 returns orders 11–20.

## Acceptance Criteria
- [ ] `GET /orders?page=1` returns the first 10 orders
- [ ] `GET /orders?page=3` returns the last 5 orders of 25
- [ ] A page below 1 returns HTTP 400
- [ ] No regression in existing functionality

## Implementation Notes for Claude Code
1. Research existing patterns in the codebase
2. Add tests for new functionality
