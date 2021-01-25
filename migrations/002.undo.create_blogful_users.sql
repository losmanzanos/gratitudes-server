ALTER TABLE gratitudes
  DROP COLUMN IF EXISTS author_id;

DROP TABLE IF EXISTS gratitude_users;