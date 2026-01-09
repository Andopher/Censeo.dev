'use client'

import Link from 'next/link';
import { User } from 'lucide-react';
import Image from 'next/image';

interface ProfileButtonProps {
    userEmail?: string;
    profilePictureUrl?: string;
}

export function ProfileButton({ userEmail, profilePictureUrl }: ProfileButtonProps) {
    // Generate initials from email for avatar fallback
    const initials = userEmail
        ? userEmail.substring(0, 2).toUpperCase()
        : 'U';

    return (
        <Link href="/profile">
            <div className="w-10 h-10 rounded-full bg-accent hover:bg-accent/80 transition-colors flex items-center justify-center cursor-pointer overflow-hidden">
                {profilePictureUrl ? (
                    <Image
                        src={profilePictureUrl}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <span className="text-white font-bold text-sm">{initials}</span>
                )}
            </div>
        </Link>
    );
}
