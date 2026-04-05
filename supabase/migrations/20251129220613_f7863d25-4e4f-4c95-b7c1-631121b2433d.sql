-- Update is_approved function to check status correctly
CREATE OR REPLACE FUNCTION public.is_approved(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT status = 'approved' FROM profiles WHERE id = user_id;
$$;