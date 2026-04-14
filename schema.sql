-- Growth Dashboard — Supabase Schema
-- Run this in the Supabase SQL Editor after creating the project.

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Alert configs (MCP write tools + UI)
CREATE TABLE public.alert_configs (
  id SERIAL PRIMARY KEY,
  metric TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  threshold REAL NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat history (IA conversacional)
CREATE TABLE public.chat_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log
CREATE TABLE public.audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
-- SECURITY DEFINER function to check admin without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admins can update roles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Policies: alert_configs
CREATE POLICY "Authenticated can read alerts" ON public.alert_configs
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and analysts can insert alerts" ON public.alert_configs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'analyst'))
  );
CREATE POLICY "Admins can manage alerts" ON public.alert_configs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can delete alerts" ON public.alert_configs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies: chat_history
CREATE POLICY "Users can read own chat" ON public.chat_history
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own chat" ON public.chat_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies: audit_log
CREATE POLICY "Admins can read audit log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Authenticated can insert audit log" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ===== PHASE 2+3: Multi-Project Data Layer =====

-- Projects
CREATE TABLE public.projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  ga4_property TEXT,
  gsc_site_url TEXT,
  github_org TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Metrics snapshots (JSONB — flexible schema per source)
CREATE TABLE public.metric_snapshots (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES public.projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('ga4', 'gsc', 'email', 'social', 'crm', 'martech', 'github')),
  data JSONB NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_snapshots_project_source ON public.metric_snapshots(project_id, source);
CREATE INDEX idx_snapshots_period ON public.metric_snapshots(period_start, period_end);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_snapshots ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read projects and snapshots
CREATE POLICY "Authenticated read projects" ON public.projects
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage projects" ON public.projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Authenticated read snapshots" ON public.metric_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role insert snapshots" ON public.metric_snapshots
  FOR INSERT WITH CHECK (true);

-- Access control: invite-only. No anonymous access to data.
-- To add demo mode in the future, use an is_public flag per project.
