CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT,
  referrer_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip TEXT,
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  user_agent TEXT,
  device_type TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.visits TO anon, authenticated;
GRANT SELECT ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can log a visit"
  ON public.visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(path) > 0 AND length(path) < 500
    AND (referrer IS NULL OR length(referrer) < 1000)
    AND (user_agent IS NULL OR length(user_agent) < 500)
  );

CREATE POLICY "admins read visits"
  ON public.visits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX visits_created_at_idx ON public.visits (created_at DESC);
CREATE INDEX visits_referrer_source_idx ON public.visits (referrer_source);