
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notifications"
  ON public.notifications FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  TO public
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notifications"
  ON public.notifications FOR UPDATE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
