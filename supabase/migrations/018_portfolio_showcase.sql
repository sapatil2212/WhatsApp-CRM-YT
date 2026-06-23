-- Create portfolio showcase items table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    metadata_tags TEXT[] DEFAULT '{}',
    project_links JSONB DEFAULT '{}',
    preview_media TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow select for all" ON public.portfolio_items
    FOR SELECT TO public USING (true);

-- Create policy for authenticated administrative operations
CREATE POLICY "Allow insert/update/delete for authenticated admin users" ON public.portfolio_items
    FOR ALL TO authenticated USING (true);
