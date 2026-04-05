-- Atualizar função handle_new_user para incluir seller_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, seller_code)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'seller_code'
  );
  
  INSERT INTO user_limits (user_id)
  VALUES (NEW.id);
  
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'teste'::app_role);
  
  RETURN NEW;
END;
$$;