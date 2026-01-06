
-- 在 public schema 中创建 uid() 函数，指向 auth.uid()
CREATE OR REPLACE FUNCTION public.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;
