-- Enable full row data for realtime updates
ALTER TABLE public.videos REPLICA IDENTITY FULL;