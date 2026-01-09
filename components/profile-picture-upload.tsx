'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { uploadProfilePicture } from '@/app/actions';

export function ProfilePictureUpload() {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await uploadProfilePicture(formData);
            window.location.reload(); // Refresh to show new picture
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload profile picture');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input
                id="profile-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
            />
            <label htmlFor="profile-upload">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start cursor-pointer"
                    disabled={uploading}
                    onClick={() => document.getElementById('profile-upload')?.click()}
                >
                    <Upload className="mr-2 w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Profile Picture'}
                </Button>
            </label>
        </div>
    );
}
