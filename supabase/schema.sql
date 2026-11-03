-- =========================================================================
-- ULAVANSANTHAI DATABASE SCHEMA FOR DRIZZLE / SUPABASE
-- Tables: admin_profile, user_profiles, buyer_profiles, seller_profiles, payments
-- =========================================================================

-- 1. ADMIN PROFILE
CREATE TABLE IF NOT EXISTS public.admin_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. USER PROFILES (Central Application Queue)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  roles TEXT[] NOT NULL,
  account_type TEXT NOT NULL,
  details JSONB NOT NULL,
  admin_status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

-- 3. BUYER PROFILES (Created upon Admin Approval)
CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  account_type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  company_legal_name TEXT,
  gstin TEXT,
  business_category TEXT,
  purposes TEXT[],
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  seller_views_allowance INT NOT NULL DEFAULT 10,
  remaining_views INT NOT NULL DEFAULT 10,
  viewed_sellers TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SELLER PROFILES (Created upon Admin Approval)
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  account_type TEXT NOT NULL,
  business_name TEXT NOT NULL,
  legal_name TEXT,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  business_category TEXT NOT NULL,
  gst_status TEXT DEFAULT 'Unregistered',
  gstin TEXT,
  pan TEXT,
  fssai_number TEXT,
  fssai_expiry TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  subscription_status TEXT NOT NULL DEFAULT 'active',
  approved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access admin_profile" ON public.admin_profile FOR ALL USING (true);
CREATE POLICY "Service role full access user_profiles" ON public.user_profiles FOR ALL USING (true);
CREATE POLICY "Service role full access buyer_profiles" ON public.buyer_profiles FOR ALL USING (true);
CREATE POLICY "Service role full access seller_profiles" ON public.seller_profiles FOR ALL USING (true);
CREATE POLICY "Service role full access payments" ON public.payments FOR ALL USING (true);

