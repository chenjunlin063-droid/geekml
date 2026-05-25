
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site_settings" ON public.site_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.site_settings(key,value) VALUES
  ('site_name','极客软件目录'),
  ('logo_url',''),
  ('hero_title','极客软件目录'),
  ('hero_subtitle','精选软件、网站与教程，点击名称即可查看对应文章'),
  ('search_placeholder','搜索软件名称或说明...'),
  ('footer_text','© 极客软件目录'),
  ('meta_description','精选软件、网站与教程目录')
ON CONFLICT (key) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets','site-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read site-assets" ON storage.objects FOR SELECT USING (bucket_id='site-assets');
CREATE POLICY "Admins write site-assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='site-assets' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update site-assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='site-assets' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete site-assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='site-assets' AND has_role(auth.uid(),'admin'));
