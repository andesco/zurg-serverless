-- Test query to see what happens when we try to fetch torrent details
-- Let's check the exact torrent name and ID

SELECT 
  name,
  id,
  length(selected_files) as file_data_length,
  selected_files,
  cache_timestamp
FROM torrents 
WHERE name LIKE '%Complete.Unknown%';
