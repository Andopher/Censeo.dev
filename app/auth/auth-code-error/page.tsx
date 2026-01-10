export default async function AuthCodeError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    return (
        <main className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
            <div className="max-w-md w-full bg-white p-8 rounded-lg border border-border text-center space-y-4">
                <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
                <p className="text-secondary">
                    Sorry, we couldn't complete the authentication process. This could be due to:
                </p>
                <ul className="text-left text-sm text-secondary space-y-2">
                    <li>• The authentication link expired</li>
                    <li>• An invalid or used code</li>
                    <li>• A network issue</li>
                </ul>
                <div className="bg-red-50 p-3 rounded text-xs text-red-800 font-mono break-all">
                    {/* Error details */}
                    Error: {(await searchParams).error || 'Unknown error'}
                </div>
                <div className="pt-4">
                    <a
                        href="/"
                        className="inline-block bg-accent text-white px-6 py-2 rounded hover:bg-accent/90 transition-colors"
                    >
                        Return to Home
                    </a>
                </div>
            </div>
        </main>
    );
}
