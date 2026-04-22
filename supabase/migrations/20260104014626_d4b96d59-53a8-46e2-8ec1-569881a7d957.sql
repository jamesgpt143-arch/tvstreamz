-- Drop the existing delete policy that only allows users to delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.live_chat_messages;

-- Create new policy that allows any authenticated user to delete any message
CREATE POLICY "Authenticated users can delete any message" 
ON public.live_chat_messages 
FOR DELETE 
USING (auth.uid() IS NOT NULL);