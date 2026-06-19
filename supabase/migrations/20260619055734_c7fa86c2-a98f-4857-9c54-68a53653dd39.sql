CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.is_admin()
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

REVOKE EXECUTE ON FUNCTION app_private.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins manage softwares" ON public.softwares;
DROP POLICY IF EXISTS "Admins manage site_settings" ON public.site_settings;

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

CREATE POLICY "Admins manage softwares" ON public.softwares
  FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

CREATE POLICY "Admins manage site_settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS "Admins write site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete site-assets" ON storage.objects;

CREATE POLICY "Admins write site-assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND app_private.is_admin()
);

CREATE POLICY "Admins update site-assets" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND app_private.is_admin()
)
WITH CHECK (
  bucket_id = 'site-assets'
  AND app_private.is_admin()
);

CREATE POLICY "Admins delete site-assets" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND app_private.is_admin()
);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;