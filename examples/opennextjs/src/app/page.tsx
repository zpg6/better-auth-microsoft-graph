"use client";

import authClient from "@/auth/authClient";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
    const { data: session, error: sessionError } = authClient.useSession();
    const [isAuthActionInProgress, setIsAuthActionInProgress] = useState(false);
    const router = useRouter();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (session) {
            router.push("/dashboard");
        }
    }, [session, router]);

    const handleMicrosoftLogin = async () => {
        setIsAuthActionInProgress(true);
        try {
            const result = await authClient.signIn.social({
                provider: "microsoft",
                scopes: [
                    // Basic user profile - Usually works without admin consent
                    "User.Read",

                    // Calendar and events - User consent only
                    "Calendars.Read",

                    // Contacts - User consent only
                    "Contacts.Read",

                    // Email messages - User consent only
                    "Mail.Read",

                    // OneDrive files - User consent only
                    "Files.Read",
                ],
            });
            console.log("Microsoft login result:", result);

            if (result.error) {
                setIsAuthActionInProgress(false);
                alert(`Microsoft login failed: ${result.error.message}`);
            } else if (result.data?.url) {
                // Redirect to Microsoft OAuth URL
                window.location.href = result.data.url;
                // Don't reset loading state - redirect is happening
            } else if (result.data) {
                // Login succeeded without redirect (shouldn't happen for OAuth)
                window.location.href = "/dashboard";
            } else {
                setIsAuthActionInProgress(false);
                alert("Unexpected response from authentication service");
            }
        } catch (e: any) {
            setIsAuthActionInProgress(false);
            alert(`An unexpected error occurred during login: ${e.message}`);
        }
    };

    if (sessionError) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Error loading session: {sessionError.message}</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Sign in with Microsoft</CardTitle>
                    <CardDescription>Powered by better-auth-microsoft-graph.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={handleMicrosoftLogin} className="w-full" disabled={isAuthActionInProgress}>
                        {isAuthActionInProgress ? (
                            "Signing In..."
                        ) : (
                            <div className="flex items-center gap-2">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <rect x="0" y="0" width="7" height="7" fill="#F25022" />
                                    <rect x="9" y="0" width="7" height="7" fill="#7FBA00" />
                                    <rect x="0" y="9" width="7" height="7" fill="#00A4EF" />
                                    <rect x="9" y="9" width="7" height="7" fill="#FFB900" />
                                </svg>
                                Continue with Microsoft
                            </div>
                        )}
                    </Button>
                </CardFooter>
            </Card>
            <footer className="absolute bottom-0 w-full text-center text-sm text-gray-500 py-4">
                <div className="space-y-3">
                    <div>Powered by better-auth-microsoft-graph</div>
                    <div className="flex items-center justify-center gap-4">
                        <a
                            href="https://github.com/zpg6/better-auth-microsoft-graph"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                            <Github size={16} />
                            <span>GitHub</span>
                        </a>
                        <a
                            href="https://www.npmjs.com/package/better-auth-microsoft-graph"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                            <Package size={16} />
                            <span>npm</span>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
