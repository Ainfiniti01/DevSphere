-- Enable Realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Update messages RLS to allow project members to see and update messages
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT TO authenticated 
USING (
  (auth.uid() = sender_id) OR 
  (auth.uid() = receiver_id) OR 
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = messages.project_id AND user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
CREATE POLICY "messages_update_policy" ON public.messages
FOR UPDATE TO authenticated 
USING (
  (auth.uid() = receiver_id) OR 
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = messages.project_id AND user_id = auth.uid()
  ))
);

-- Ensure chat_reads is accessible
ALTER TABLE public.chat_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own chat reads" ON public.chat_reads;
CREATE POLICY "Users can manage their own chat reads" ON public.chat_reads
FOR ALL TO authenticated USING (auth.uid() = user_id);