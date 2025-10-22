-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('free', 'pro', 'enterprise');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'enterprise' THEN 1
      WHEN 'pro' THEN 2
      WHEN 'free' THEN 3
    END
  LIMIT 1
$$;

-- Create function to check if user has minimum role
CREATE OR REPLACE FUNCTION public.has_min_role(_user_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        (role = 'enterprise') OR
        (role = 'pro' AND _min_role IN ('pro', 'free')) OR
        (role = 'free' AND _min_role = 'free')
      )
  )
$$;

-- RLS Policies
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger to auto-assign free role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Add clip generation limits to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS clips_generated_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_clip_reset_date TIMESTAMP WITH TIME ZONE DEFAULT now();