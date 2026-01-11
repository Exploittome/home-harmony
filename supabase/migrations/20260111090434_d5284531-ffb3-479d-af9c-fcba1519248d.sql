-- Create a function that calls our edge function when a new listing is inserted
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  payload jsonb;
  edge_function_url text;
BEGIN
  -- Build the payload with listing data
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
  
  -- Get the edge function URL from vault or use hardcoded project URL
  edge_function_url := 'https://qselmijdcggthggjvdej.supabase.co/functions/v1/notify-new-listing';
  
  -- Call the edge function using pg_net extension
  PERFORM net.http_post(
    url := edge_function_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to notify on new listings
DROP TRIGGER IF EXISTS on_new_listing_notify ON public.listings;

CREATE TRIGGER on_new_listing_notify
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_listing();