ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE public.cars
DROP CONSTRAINT IF EXISTS cars_video_url_format_check;

ALTER TABLE public.cars
ADD CONSTRAINT cars_video_url_format_check
CHECK (
  video_url IS NULL
  OR (
    char_length(video_url) <= 1000
    AND (
      video_url ~ '^https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}$'
      OR video_url ~ '^https://rutube\.ru/video/[a-f0-9]{32}/$'
      OR video_url ~ '^https://vk\.com/video-?[0-9]+_[0-9]+$'
      OR video_url ~ '^https://vk\.com/video_ext\.php\?oid=-?[0-9]+&id=[0-9]+&hash=[A-Za-z0-9_-]{6,128}&hd=2$'
    )
  )
);

COMMENT ON COLUMN public.cars.video_url IS
  'Normalized HTTPS link to a supported YouTube, RUTUBE, or VK Video video.';