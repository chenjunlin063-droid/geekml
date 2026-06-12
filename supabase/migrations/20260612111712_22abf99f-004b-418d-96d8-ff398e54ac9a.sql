
-- 1) Harden has_role: enforce that callers can only check their own role (or service_role bypass)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        _user_id = auth.uid()
        OR auth.jwt() ->> 'role' = 'service_role'
      )
  )
$$;

-- 2) Lock down EXECUTE on has_role; only authenticated needs it for RLS
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 3) Remove broad public SELECT on storage.objects for site-assets to prevent listing.
-- Files remain reachable via the public CDN URL (/storage/v1/object/public/...) because the bucket is public.
DROP POLICY IF EXISTS "Public read site-assets" ON storage.objects;
