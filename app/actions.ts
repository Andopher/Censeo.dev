'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function startTest(testId: string, formData: FormData) {
    const supabase = await createClient(); // Await promise
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string || user.email!;

    // 1. Check for existing submission (Prevent Duplicates)
    const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('test_id', testId)
        .eq('candidate_id', user.id)
        .maybeSingle();

    if (existing) {
        console.log(`[StartTest] Resuming existing submission ${existing.id}`);
        return redirect(`/t/${testId}/play?sid=${existing.id}`);
    }

    const { data: submission, error } = await supabase
        .from('submissions')
        .insert({
            test_id: testId,
            candidate_id: user.id,
            candidate_name: name,
            candidate_email: email,
        })
        .select()
        .single();

    if (error) {
        console.error('Error starting test:', error);
        throw new Error('Failed to start test');
    }

    return redirect(`/t/${testId}/play?sid=${submission.id}`);
}

export async function submitResponse(submissionId: string, questionId: string, answer: any, timeSpent: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('[submitResponse] Starting:', { submissionId, questionId, userId: user?.id });

    // 1. Save Response
    const { error } = await supabase
        .from('responses')
        .insert({
            submission_id: submissionId,
            question_id: questionId,
            answer: answer,
            time_spent_seconds: timeSpent,
        });

    if (error) {
        console.error('[submitResponse] Error submitting response:', error);
        console.error('[submitResponse] Details:', { submissionId, questionId, userId: user?.id });

        // Check if it's a duplicate key error (question already answered)
        if (error.code === '23505') {
            console.log('[submitResponse] Question already answered, skipping...');
            return { success: true, duplicate: true };
        }

        throw new Error('Failed to submit response: ' + error.message);
    }

    console.log('[submitResponse] Response saved successfully');

    // 2. Check if complete?
    // We can do this check on the client or subsequent server load, 
    // but updating completed_at is good practice here if it was the last one.
    // For speed/simplicity, I will let the client redirect or next load determine completion.
    // Actually, let's just revalidate the path.
    // We need to revalidate path: revalidatePath(`/t/[id]/play`); 
    // but we don't know [id] here easily unless passed.
    // Let's just return success.
    return { success: true };
}

export async function addNote(submissionId: string, noteText: string, authorEmail: string) {
    const supabase = createClient();
    const { error } = await (await supabase)
        .from('reviewer_notes')
        .insert({
            submission_id: submissionId,
            note_text: noteText,
            author_email: authorEmail
        });

    if (error) {
        console.error('Error adding note:', error);
        throw new Error('Failed to add note');
    }
}

export async function createTest(formData: any) {
    const supabase = await createClient();

    const { title, scenario, type, questions, created_by, time_limit_seconds, is_published = true } = formData;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Create Test
    const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
            title,
            scenario_text: scenario,
            template_type: type,
            created_by: user.id,
            time_limit_seconds: time_limit_seconds || null,
            is_published: is_published,
        })
        .select()
        .single();

    if (testError) {
        console.error('Error creating test:', testError);
        throw new Error('Failed to create test');
    }

    // 2. Create Questions
    const questionsData = questions.map((q: any) => ({
        test_id: test.id,
        order: q.order,
        type: q.type,
        prompt: q.prompt,
        constraints: q.constraints || {},
    }));

    const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsData);

    if (questionsError) {
        console.error('Error creating questions:', questionsError);
        // Cleanup test? relying on transaction? Supabase doesn't support multi-table transaction via JS client easily yet without RPC.
        // For MVP, we ignore cleanup risk.
        throw new Error('Failed to create questions');
    }

    return { success: true, id: test.id };
}

export async function uploadProfilePicture(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // Upload to storage bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload file');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

    // Update profile with picture URL
    const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            email: user.email,
            profile_picture_url: publicUrl
        }, {
            onConflict: 'id'
        });

    if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error('Failed to update profile');
    }

    return { success: true, url: publicUrl };
}


export async function signUp(formData: FormData) {
    const supabase = await createClient(); // Await the promise
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string; // 'tester' or 'testee'
    const fullName = formData.get('full_name') as string;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role,
            }
        }
    });

    if (error) {
        return { error: error.message };
    }

    if (data.user) {
        // Manually create profile to ensure it exists immediately
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: email,
            role: role as any,
            full_name: fullName
        });

        if (profileError) {
            console.error("Profile creation failed:", profileError);
            // Should we return error? For MVP, if auth works but profile fails, it's weird.
            // But usually it succeeds. Let's log.
        }
    }

    return { success: true };
}

export async function signIn(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true };
}

export async function deleteTest(testId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Check if test exists and belongs to user
    const { data: test, error: fetchError } = await supabase
        .from('tests')
        .select('created_by')
        .eq('id', testId)
        .single();

    if (fetchError || !test) {
        throw new Error('Test not found');
    }
    if (test.created_by !== user.id) {
        throw new Error('Unauthorized');
    }

    // Manual cascade delete due to foreign key constraints
    console.log(`[DeleteTest] Starting deletion for test: ${testId}`);

    // 1. Get all submission IDs for this test
    const { data: submissions, error: subFetchError } = await supabase
        .from('submissions')
        .select('id')
        .eq('test_id', testId);

    if (subFetchError) {
        console.error('[DeleteTest] Error fetching submissions:', subFetchError);
        throw new Error('Failed to fetch submissions for deletion');
    }

    const submissionIds = submissions?.map(s => s.id) || [];
    console.log(`[DeleteTest] Found ${submissionIds.length} submissions to delete`);

    if (submissionIds.length > 0) {
        // 2. Delete responses for these submissions
        const { error: respError } = await supabase
            .from('responses')
            .delete()
            .in('submission_id', submissionIds);

        if (respError) {
            console.error('[DeleteTest] Error deleting responses:', respError);
            throw new Error('Failed to delete responses');
        }

        // 3. Delete reviewer notes for these submissions
        const { error: notesError } = await supabase
            .from('reviewer_notes')
            .delete()
            .in('submission_id', submissionIds);

        if (notesError) {
            console.error('[DeleteTest] Error deleting reviewer notes:', notesError);
            // Continue? Notes might not stop deletion usually, but let's be safe.
        }

        // 4. Delete the submissions themselves
        const { error: subDeleteError } = await supabase
            .from('submissions')
            .delete()
            .eq('test_id', testId);

        if (subDeleteError) {
            console.error('[DeleteTest] Error deleting submissions:', subDeleteError);
            throw new Error('Failed to delete submissions');
        }
    }

    // 5. Delete questions linked to the test
    const { error: qError } = await supabase
        .from('questions')
        .delete()
        .eq('test_id', testId);

    if (qError) {
        console.error('[DeleteTest] Error deleting questions:', qError);
        throw new Error('Failed to delete questions');
    }

    // 6. Finally delete the test
    const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', testId);

    if (error) {
        console.error('[DeleteTest] Error deleting test record:', error);
        throw new Error('Failed to delete test record');
    }

    console.log(`[DeleteTest] Successfully deleted test ${testId}`);

    return { success: true };
}
