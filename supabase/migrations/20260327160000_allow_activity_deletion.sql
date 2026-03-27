-- Allow users to delete their own activity feed items
CREATE POLICY "users can delete their own activity_feed"
    ON public.activity_feed FOR DELETE USING (auth.uid() = user_id);

-- Enable real-time for activity_feed table
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."activity_feed";
