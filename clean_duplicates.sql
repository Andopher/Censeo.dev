-- SQL Script to Clean Up Duplicate Submissions (FIXED)
-- Keeps COMPLETED or MOST RECENT (by started_at) submission. Deletes others.

BEGIN;

-- 1. Identify duplicates to remove
CREATE TEMP TABLE ids_to_remove AS
SELECT id FROM (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY test_id, candidate_id 
           ORDER BY completed_at DESC NULLS LAST, started_at DESC -- Corrected column name
         ) as row_num
  FROM submissions
) t WHERE row_num > 1;

-- 2. Delete responses
DELETE FROM responses 
WHERE submission_id IN (SELECT id FROM ids_to_remove);

-- 3. Delete notes
DELETE FROM reviewer_notes 
WHERE submission_id IN (SELECT id FROM ids_to_remove);

-- 4. Delete submissions
DELETE FROM submissions 
WHERE id IN (SELECT id FROM ids_to_remove);

DROP TABLE ids_to_remove;

COMMIT;

SELECT 'Duplicates cleaned up successfully' as status;
