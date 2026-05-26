
INSERT INTO storage.buckets (id, name, public) VALUES ('cookie-images', 'cookie-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Imagens de cookies públicas" ON storage.objects FOR SELECT
  USING (bucket_id = 'cookie-images');

CREATE POLICY "Admins enviam imagens" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cookie-images' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins atualizam imagens" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'cookie-images' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins removem imagens" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cookie-images' AND public.has_role(auth.uid(),'admin'));
