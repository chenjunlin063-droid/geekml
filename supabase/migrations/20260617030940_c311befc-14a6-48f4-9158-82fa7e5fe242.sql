
-- Fix storage RLS for site-assets: check user_roles inline (more robust)
DROP POLICY IF EXISTS "Admins write site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete site-assets" ON storage.objects;

CREATE POLICY "Admins write site-assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins update site-assets" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins delete site-assets" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'site-assets'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
