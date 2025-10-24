-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a cron job to poll video status every 2 minutes
SELECT cron.schedule(
  'poll-video-status',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url:='https://kpulfxvaugjerklhqxpd.supabase.co/functions/v1/poll-video-status',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdWxmeHZhdWdqZXJrbGhxeHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjgzNjAsImV4cCI6MjA3Njg0NDM2MH0.isiwPWh8rExsbwKjXYbGvJG-ejwYBchGqNcXPqd54UI"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);