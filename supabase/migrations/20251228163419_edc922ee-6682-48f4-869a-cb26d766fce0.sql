-- Add phone number column to listings table
ALTER TABLE public.listings 
ADD COLUMN phone TEXT;