-- Enable pg_net for calling Edge Functions from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Recreate function (ensure it works without requiring any Authorization header since verify_jwt=false)
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payload jsonb;
  edge_function_url text;
BEGIN
  payload := jsonb_build_object(
    'type', 'INSERT',
    'record', jsonb_build_object(
      'id', NEW.id,
      'title', NEW.title,
      'price', NEW.price,
      'city', NEW.city,
      'rooms', NEW.rooms,
      'area', NEW.area,
      'phone', NEW.phone,
      'description', NEW.description,
      'image_url', NEW.image_url
    )
  );

  edge_function_url := 'https://qselmijdcggthggjvdej.supabase.co/functions/v1/notify-new-listing';

  PERFORM net.http_post(
    url := edge_function_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger on listings inserts
DROP TRIGGER IF EXISTS on_new_listing_notify ON public.listings;
CREATE TRIGGER on_new_listing_notify
AFTER INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_listing();
