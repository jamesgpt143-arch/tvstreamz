-- Allow users to delete their own chat messages
CREATE POLICY "Users can delete their own messages"
ON public.live_chat_messages
FOR DELETE
USING (auth.uid() = user_id);