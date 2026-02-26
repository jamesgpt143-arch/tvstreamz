DROP POLICY "Authenticated users can delete any message" ON public.live_chat_messages;

CREATE POLICY "Users can delete own messages" 
ON public.live_chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any message" 
ON public.live_chat_messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));