-- Fix site-assets uploads by using a SECURITY DEFINER admin check inside storage RLS.
-- Directly querying public.user_roles from storage policies can be blocked by table privileges/RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins write site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete site-assets" ON storage.objects;

CREATE POLICY "Admins write site-assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND public.is_admin()
);

CREATE POLICY "Admins update site-assets" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'site-assets'
  AND public.is_admin()
);

CREATE POLICY "Admins delete site-assets" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND public.is_admin()
);
