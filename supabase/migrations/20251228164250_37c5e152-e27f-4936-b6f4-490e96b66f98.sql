-- Add images array column to listings
ALTER TABLE public.listings 
ADD COLUMN images text[] DEFAULT '{}';

-- Update existing listings with multiple test images
UPDATE public.listings 
SET images = ARRAY[
  image_url,
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4'
]
WHERE image_url IS NOT NULL;