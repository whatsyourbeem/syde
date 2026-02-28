-- Create insights table
CREATE TABLE IF NOT EXISTS public.insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    content JSONB NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create insight_comments table
CREATE TABLE IF NOT EXISTS public.insight_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create insight_likes table
CREATE TABLE IF NOT EXISTS public.insight_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(insight_id, user_id)
);

-- Create insight_bookmarks table
CREATE TABLE IF NOT EXISTS public.insight_bookmarks (
    insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(insight_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies for insights
CREATE POLICY "Public insights are viewable by everyone."
    ON public.insights FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own insights."
    ON public.insights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights."
    ON public.insights FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights."
    ON public.insights FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for insight_comments
CREATE POLICY "Public insight comments are viewable by everyone."
    ON public.insight_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own insight comments."
    ON public.insight_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insight comments."
    ON public.insight_comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insight comments."
    ON public.insight_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for insight_likes
CREATE POLICY "Public insight likes are viewable by everyone."
    ON public.insight_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own insight likes."
    ON public.insight_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insight likes."
    ON public.insight_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for insight_bookmarks
CREATE POLICY "Users can view their own insight bookmarks."
    ON public.insight_bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insight bookmarks."
    ON public.insight_bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insight bookmarks."
    ON public.insight_bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER set_public_insights_updated_at
    BEFORE UPDATE ON public.insights
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_public_insight_comments_updated_at
    BEFORE UPDATE ON public.insight_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
