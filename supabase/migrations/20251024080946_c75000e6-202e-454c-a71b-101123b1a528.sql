-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable realtime for videos table
ALTER TABLE public.videos REPLICA IDENTITY FULL;

-- Create cron job to poll video status every minute
SELECT cron.schedule(
  'poll-video-status-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kpulfxvaugjerklhqxpd.supabase.co/functions/v1/poll-video-status',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdWxmeHZhdWdqZXJrbGhxeHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjgzNjAsImV4cCI6MjA3Njg0NDM2MH0.isiwPWh8rExsbwKjXYbGvJG-ejwYBchGqNcXPqd54UI"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  );
  $$
);