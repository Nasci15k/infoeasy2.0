CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);


--
-- Name: user_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status AS ENUM (
    'pending',
    'approved',
    'suspended'
);


--
-- Name: create_default_user_limits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_default_user_limits() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO user_limits (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT role = 'admin' FROM profiles WHERE id = user_id;
$$;


--
-- Name: is_approved(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_approved(user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT status = 'approved' FROM profiles WHERE id = user_id;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: api_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: apis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    endpoint text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    status public.user_status DEFAULT 'pending'::public.user_status NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: query_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    api_id uuid NOT NULL,
    query_value text NOT NULL,
    response_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    daily_limit integer DEFAULT 10 NOT NULL,
    monthly_limit integer DEFAULT 300 NOT NULL,
    daily_count integer DEFAULT 0 NOT NULL,
    monthly_count integer DEFAULT 0 NOT NULL,
    last_reset_daily timestamp with time zone DEFAULT now() NOT NULL,
    last_reset_monthly timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: api_categories api_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_categories
    ADD CONSTRAINT api_categories_pkey PRIMARY KEY (id);


--
-- Name: apis apis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apis
    ADD CONSTRAINT apis_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: query_history query_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_history
    ADD CONSTRAINT query_history_pkey PRIMARY KEY (id);


--
-- Name: user_limits user_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_limits
    ADD CONSTRAINT user_limits_pkey PRIMARY KEY (id);


--
-- Name: user_limits user_limits_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_limits
    ADD CONSTRAINT user_limits_user_id_key UNIQUE (user_id);


--
-- Name: profiles create_limits_on_approval; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER create_limits_on_approval AFTER INSERT OR UPDATE OF status ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_default_user_limits();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: apis apis_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apis
    ADD CONSTRAINT apis_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.api_categories(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: query_history query_history_api_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_history
    ADD CONSTRAINT query_history_api_id_fkey FOREIGN KEY (api_id) REFERENCES public.apis(id) ON DELETE CASCADE;


--
-- Name: query_history query_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_history
    ADD CONSTRAINT query_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_limits user_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_limits
    ADD CONSTRAINT user_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_limits Admins podem atualizar limites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem atualizar limites" ON public.user_limits FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins podem atualizar perfis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem atualizar perfis" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: apis Admins podem gerenciar APIs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar APIs" ON public.apis USING (public.is_admin(auth.uid()));


--
-- Name: api_categories Admins podem gerenciar categorias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar categorias" ON public.api_categories USING (public.is_admin(auth.uid()));


--
-- Name: query_history Admins podem ver todo o histórico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem ver todo o histórico" ON public.query_history FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: user_limits Admins podem ver todos os limites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem ver todos os limites" ON public.user_limits FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins podem ver todos os perfis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: apis Usuários aprovados podem ver APIs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários aprovados podem ver APIs" ON public.apis FOR SELECT USING ((public.is_approved(auth.uid()) AND (is_active = true)));


--
-- Name: api_categories Usuários aprovados podem ver categorias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários aprovados podem ver categorias" ON public.api_categories FOR SELECT USING (public.is_approved(auth.uid()));


--
-- Name: query_history Usuários podem inserir no histórico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem inserir no histórico" ON public.query_history FOR INSERT WITH CHECK (((auth.uid() = user_id) AND public.is_approved(auth.uid())));


--
-- Name: query_history Usuários podem ver seu próprio histórico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver seu próprio histórico" ON public.query_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Usuários podem ver seu próprio perfil; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_limits Usuários podem ver seus próprios limites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver seus próprios limites" ON public.user_limits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: api_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: apis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apis ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: query_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.query_history ENABLE ROW LEVEL SECURITY;

--
-- Name: user_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


