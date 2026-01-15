-- Clean up data for user db3ba010-1aba-4901-a806-852a9d643fb0

-- 1. Delete Responses linked to this user's submissions
DELETE FROM public.responses 
WHERE submission_id IN (
    SELECT id FROM public.submissions 
    WHERE candidate_id = 'db3ba010-1aba-4901-a806-852a9d643fb0'
);

-- 2. Delete Reviewer Notes linked to this user's submissions
DELETE FROM public.reviewer_notes 
WHERE submission_id IN (
    SELECT id FROM public.submissions 
    WHERE candidate_id = 'db3ba010-1aba-4901-a806-852a9d643fb0'
);

-- 3. Delete Submissions
DELETE FROM public.submissions 
WHERE candidate_id = 'db3ba010-1aba-4901-a806-852a9d643fb0';

-- 4. Delete Profile (if exists in public table)
DELETE FROM public.profiles 
WHERE id = 'db3ba010-1aba-4901-a806-852a9d643fb0';

-- NOTE: This removes the user's data from your public tables.
-- To remove their login (Auth), go to Supabase Dashboard > Authentication > Users 
-- and delete the user with UUID: db3ba010-1aba-4901-a806-852a9d643fb0
