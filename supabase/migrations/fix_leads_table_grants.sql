-- Fix: "permission denied for table leads_and_inquiries" (Postgres 42501) for the anon role.
-- RLS policies exist, but the table-level GRANTs are missing, so every read/return of rows fails.
-- Run once in Supabase Dashboard -> SQL Editor.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads_and_inquiries TO anon, authenticated;

-- Ensure matching policies exist (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leads_and_inquiries' AND policyname='Public can insert leads') THEN
    CREATE POLICY "Public can insert leads" ON public.leads_and_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leads_and_inquiries' AND policyname='Authenticated users can select leads') THEN
    CREATE POLICY "Authenticated users can select leads" ON public.leads_and_inquiries FOR SELECT TO authenticated, anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leads_and_inquiries' AND policyname='Authenticated users can update leads') THEN
    CREATE POLICY "Authenticated users can update leads" ON public.leads_and_inquiries FOR UPDATE TO authenticated, anon USING (true);
  END IF;
END $$;
