-- 1. Create the messages table if it does not exist at all
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying,
    email character varying,
    subject character varying,
    message text,
    status character varying DEFAULT 'unread',
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. If the table already existed but was missing columns, add them
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS name character varying;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS email character varying;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS subject character varying;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status character varying DEFAULT 'unread';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Allow the public (unauthenticated users) to submit contact messages
DROP POLICY IF EXISTS "Allow public insert to messages" ON public.messages;
CREATE POLICY "Allow public insert to messages"
  ON public.messages FOR INSERT
  WITH CHECK (true);

-- 5. Allow authenticated admins (you) to read and edit the messages
DROP POLICY IF EXISTS "Allow authenticated full access to messages" ON public.messages;
CREATE POLICY "Allow authenticated full access to messages"
  ON public.messages FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
