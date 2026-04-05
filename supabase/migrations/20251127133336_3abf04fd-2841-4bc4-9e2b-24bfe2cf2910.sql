-- Corrigir search_path das funções antigas
CREATE OR REPLACE FUNCTION public.create_default_user_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND NOT EXISTS (
    SELECT 1 FROM user_limits WHERE user_id = NEW.id
  ) THEN
    INSERT INTO user_limits (user_id, daily_limit, monthly_limit)
    VALUES (NEW.id, 100, 3000);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO user_limits (user_id)
  VALUES (NEW.id);
  
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'teste'::app_role);
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_approved(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status = 'approved' FROM profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;