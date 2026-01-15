-- SQL Script to Fix "Stuck" In Progress Tests (FINAL)
-- Updates "In Progress" tests to Complete if all questions are answered.

UPDATE submissions s
SET completed_at = COALESCE(last_response_time, NOW())
FROM (
    SELECT 
        s.id,
        MAX(r.answered_at) as last_response_time
    FROM submissions s
    JOIN (
         SELECT test_id, COUNT(*) as expected_count
         FROM questions
         GROUP BY test_id
    ) q ON s.test_id = q.test_id
    JOIN responses r ON s.id = r.submission_id
    WHERE s.completed_at IS NULL
    GROUP BY s.id, q.expected_count
    HAVING COUNT(*) >= q.expected_count  -- Changed from COUNT(r.id) to COUNT(*)
) as completed_subs
WHERE s.id = completed_subs.id;

SELECT 'Fixed stuck tests' as status;
