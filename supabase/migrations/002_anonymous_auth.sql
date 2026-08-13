-- ─────────────────────────────────────────────────────────────
-- Switches sign-in to name-only (Supabase anonymous auth).
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- (only needed if you already ran the original schema.sql — a
-- fresh install can just use the updated schema.sql instead).
--
-- You also need to flip a dashboard setting — this SQL can't do
-- it for you: Authentication → Sign In / Providers →
-- Anonymous Sign-Ins → enable.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles alter column email drop not null;
