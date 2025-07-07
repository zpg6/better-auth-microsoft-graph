import { initAuth } from "@/auth";
import MicrosoftGraphDemo from "@/components/MicrosoftGraphDemo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Github, Package } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
    const authInstance = await initAuth();
    // Fetch session using next/headers per better-auth docs for server components
    const session = await authInstance.api.getSession({ headers: await headers() });

    if (!session) {
        redirect("/"); // Redirect to home if no session
    }

    // Access another plugin's endpoint to demonstrate plugin type inference is still intact
    const openAPISpec = await authInstance.api.generateOpenAPISchema();

    return (
        <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
            <main className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-2">Powered by better-auth-microsoft-graph</p>
                    </div>

                    <Tabs defaultValue="microsoft" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="user">Account Info</TabsTrigger>
                            <TabsTrigger value="microsoft">Microsoft Services</TabsTrigger>
                        </TabsList>

                        <TabsContent value="user" className="space-y-6">
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle className="text-xl font-semibold">User Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-lg">
                                        Welcome,{" "}
                                        <span className="font-semibold">
                                            {session.user?.name || session.user?.email || "Anonymous User"}
                                        </span>
                                        !
                                    </p>
                                    {session.user?.email && (
                                        <p className="text-md break-words">
                                            <strong>Email:</strong>{" "}
                                            <span className="break-all">{session.user.email}</span>
                                        </p>
                                    )}
                                    {!session.user?.email && (
                                        <p className="text-md">
                                            <strong>Account Type:</strong> Anonymous
                                        </p>
                                    )}
                                    {session.user?.id && (
                                        <p className="text-md">
                                            <strong>Better Auth User ID:</strong> {session.user.id}
                                        </p>
                                    )}
                                    <SignOutButton /> {/* Use the client component for sign out */}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="microsoft" className="space-y-6">
                            <MicrosoftGraphDemo />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            <footer className="w-full text-center text-sm text-gray-500 py-4 mt-8">
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
                        <Link
                            href="/api/auth/reference#tag/microsoft/get/microsoft/me"
                            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                            title={`OpenAPI v${openAPISpec.openapi} Schema`}
                        >
                            <FileText size={16} />
                            <span>OpenAPI</span>
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
