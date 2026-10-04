# ADR-0001: Multi-Subsidiary Isolation via PostgreSQL Row-Level Security

**Status:** Accepted  
**Date:** 2026-10-03  
**Decision Makers:** GeoMine Architecture Team

## Context

GeoMine serves CMPDI and all Coal India subsidiaries (ECL, BCCL, CCL, WCL, SECL, MCL, NCL).
Each subsidiary's data must be strictly isolated — no subsidiary should ever see another's
documents, facts, or reports through any query path.

Options considered:
1. **Separate databases per subsidiary** — strong isolation but heavy operational burden
2. **Schema-per-tenant** — good isolation but complicates migrations and shared queries
3. **Row-Level Security (RLS)** — single schema, enforced at the database layer

## Decision

Use **PostgreSQL Row-Level Security** with a `subsidiary_id` column on every data table and
an RLS policy that filters on `current_setting('app.subsidiary_id')`.

The API middleware sets this session variable from the authenticated JWT's subsidiary claim
before every database operation.

## Consequences

- **Positive:** Single migration path, simple backup/restore, DB-enforced isolation even if
  application code has bugs.
- **Positive:** Cross-subsidiary analytics possible for CMPDI admin via policy override.
- **Negative:** Must ensure every table has the column and policy. Covered by migration tests.
- **Negative:** Must never use `SET ROLE` or superuser connections in application code.

## Compliance

- R13: Multi-tenancy by subsidiary using PostgreSQL row level security. No query bypasses it.
