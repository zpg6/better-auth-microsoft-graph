"use client";

import authClient from "@/auth/authClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact, Drive, Event, Message, Calendar as MSCalendar, User } from "@microsoft/microsoft-graph-types";
import { AlertTriangle, Calendar, Folder, Mail, Users } from "lucide-react";
import { useEffect, useState } from "react";

// Define the result type structure that comes from our endpoints
interface GraphApiResult<T> {
    success: boolean;
    statusCode: number;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

// Define the typed data structure for our state
interface MicrosoftGraphData {
    me: GraphApiResult<User> | null;
    calendar: GraphApiResult<MSCalendar> | null;
    events: GraphApiResult<Event[]> | null;
    contacts: GraphApiResult<Contact[]> | null;
    messages: GraphApiResult<Message[]> | null;
    drive: GraphApiResult<Drive> | null;
}

// Loading states for individual services
interface LoadingStates {
    me: boolean;
    calendar: boolean;
    events: boolean;
    contacts: boolean;
    messages: boolean;
    drive: boolean;
}

// Skeleton component for loading states
const SkeletonLine = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export default function MicrosoftGraphDemo() {
    const [microsoftData, setMicrosoftData] = useState<MicrosoftGraphData>({
        me: null,
        calendar: null,
        events: null,
        contacts: null,
        messages: null,
        drive: null,
    });
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
        me: true,
        calendar: true,
        events: true,
        contacts: true,
        messages: true,
        drive: true,
    });
    const [hasPermissionIssues, setHasPermissionIssues] = useState<boolean>(false);

    // Auto-load data on component mount
    useEffect(() => {
        // Debug: Check what scopes we have
        authClient
            .getSession()
            .then(session => {
                console.log("Current session:", session);
                console.log("Available scopes in token:", session?.data?.user);
            })
            .catch(console.error);

        fetchMicrosoftData();
    }, []);

    // Helper function to handle individual endpoint calls
    const callEndpoint = async <T,>(
        name: string,
        loadingKey: keyof LoadingStates,
        endpointCall: () => Promise<any>,
        updateData: (result: GraphApiResult<T>) => void
    ): Promise<void> => {
        try {
            setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));

            console.log("Calling endpoint:", name);
            const clientResult = await endpointCall();
            console.log(name, "Client result:", clientResult);

            if (clientResult.data && !clientResult.error) {
                // Extract the actual Microsoft Graph data from the nested structure
                const actualData = clientResult.data.data;
                const graphResult: GraphApiResult<T> = {
                    success: true,
                    statusCode: clientResult.data.statusCode || 200,
                    data: actualData,
                };
                updateData(graphResult);
            } else if (clientResult.error) {
                if (clientResult.error.message?.includes("403") || clientResult.error.message?.includes("Forbidden")) {
                    setHasPermissionIssues(true);
                }
                const graphResult: GraphApiResult<T> = {
                    success: false,
                    statusCode: 403,
                    error: clientResult.error,
                };
                updateData(graphResult);
            }
        } catch (error) {
            console.warn(`${name} endpoint temporarily unavailable`);
        } finally {
            setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    const fetchMicrosoftData = async (): Promise<void> => {
        setHasPermissionIssues(false);

        console.log("Fetching Microsoft data");

        // Execute all endpoint calls in parallel
        await Promise.all([
            callEndpoint<User>(
                "Profile",
                "me",
                () => authClient.microsoft.me(),
                result => setMicrosoftData(prev => ({ ...prev, me: result }))
            ),
            callEndpoint<MSCalendar>(
                "Calendar",
                "calendar",
                () => authClient.microsoft.me.calendar(),
                result => setMicrosoftData(prev => ({ ...prev, calendar: result }))
            ),
            callEndpoint<Event[]>(
                "Events",
                "events",
                () =>
                    authClient.microsoft.me.events({
                        query: { $top: 10, $select: "subject,start,end,location" },
                    }),
                result => setMicrosoftData(prev => ({ ...prev, events: result }))
            ),
            callEndpoint<Contact[]>(
                "Contacts",
                "contacts",
                () => authClient.microsoft.me.contacts(),
                result => setMicrosoftData(prev => ({ ...prev, contacts: result }))
            ),
            callEndpoint<Message[]>(
                "Messages",
                "messages",
                () =>
                    authClient.microsoft.me.messages({
                        query: { $top: 5, $orderby: "receivedDateTime desc" },
                    }),
                result => setMicrosoftData(prev => ({ ...prev, messages: result }))
            ),
            callEndpoint<Drive>(
                "OneDrive",
                "drive",
                () => authClient.microsoft.me.drive(),
                result => setMicrosoftData(prev => ({ ...prev, drive: result }))
            ),
        ]);
    };

    return (
        <div className="space-y-6">
            {/* Permission Notice */}
            {hasPermissionIssues && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-medium text-amber-800 mb-1">Additional Permissions Needed</h3>
                                <p className="text-sm text-amber-700 mb-3">
                                    Some Microsoft services require additional permissions to display your data.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => (window.location.href = "/api/auth/signout")}
                                        className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded border"
                                    >
                                        Sign out & back in
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Clear all auth-related storage
                                            localStorage.clear();
                                            sessionStorage.clear();
                                            // Force signout with redirect
                                            window.location.href = "/api/auth/signout?redirectTo=/";
                                        }}
                                        className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded border"
                                    >
                                        Clear auth & restart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Microsoft Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingStates.me ? (
                            <div className="space-y-3">
                                <div>
                                    <SkeletonLine className="h-3 w-8 mb-1" />
                                    <SkeletonLine className="h-5 w-24" />
                                </div>
                                <div>
                                    <SkeletonLine className="h-3 w-10 mb-1" />
                                    <SkeletonLine className="h-4 w-32" />
                                </div>
                                <div>
                                    <SkeletonLine className="h-3 w-12 mb-1" />
                                    <SkeletonLine className="h-4 w-20" />
                                </div>
                            </div>
                        ) : microsoftData.me?.success && microsoftData.me.data ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Display Name</p>
                                    <p className="font-medium">
                                        {microsoftData.me.data.displayName || "Not available"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email Address</p>
                                    <p className="font-medium text-sm">
                                        {microsoftData.me.data.mail ||
                                            microsoftData.me.data.userPrincipalName ||
                                            "Not available"}
                                    </p>
                                </div>
                                {microsoftData.me.data.jobTitle && (
                                    <div>
                                        <p className="text-sm text-gray-500">Job Title</p>
                                        <p className="font-medium">{microsoftData.me.data.jobTitle}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500 text-sm">Account access not available</p>
                                <p className="text-xs text-gray-400 mt-1">Additional permissions required</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Calendar Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            Calendar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingStates.events ? (
                            <div className="space-y-3">
                                <div>
                                    <SkeletonLine className="h-3 w-20 mb-1" />
                                    <SkeletonLine className="h-8 w-8" />
                                </div>
                                <div className="border-l-2 border-gray-200 pl-3">
                                    <SkeletonLine className="h-4 w-28 mb-1" />
                                    <SkeletonLine className="h-3 w-16" />
                                </div>
                                <div className="border-l-2 border-gray-200 pl-3">
                                    <SkeletonLine className="h-4 w-24 mb-1" />
                                    <SkeletonLine className="h-3 w-14" />
                                </div>
                            </div>
                        ) : microsoftData.events?.success &&
                          microsoftData.events.data &&
                          Array.isArray(microsoftData.events.data) ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Upcoming Events</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {microsoftData.events.data.length}
                                    </p>
                                </div>
                                {microsoftData.events.data.slice(0, 2).map((event, index) => (
                                    <div key={index} className="text-sm border-l-2 border-green-200 pl-3">
                                        <p className="font-medium">{event.subject || "No Subject"}</p>
                                        <p className="text-gray-500">
                                            {event.start?.dateTime
                                                ? new Date(event.start.dateTime).toLocaleDateString()
                                                : "No Date"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500 text-sm">Calendar access not available</p>
                                <p className="text-xs text-gray-400 mt-1">Additional permissions required</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* OneDrive Card */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Folder className="h-5 w-5 text-orange-600" />
                            </div>
                            OneDrive
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingStates.drive ? (
                            <div className="space-y-3">
                                <div>
                                    <SkeletonLine className="h-3 w-20 mb-1" />
                                    <SkeletonLine className="h-8 w-12" />
                                </div>
                                <div>
                                    <SkeletonLine className="h-3 w-18 mb-1" />
                                    <SkeletonLine className="h-4 w-16" />
                                </div>
                            </div>
                        ) : microsoftData.drive?.success && microsoftData.drive.data ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Storage Used</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {microsoftData.drive.data.quota?.used
                                            ? `${Math.round(microsoftData.drive.data.quota.used / (1024 * 1024 * 1024))} GB`
                                            : "0 GB"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Storage</p>
                                    <p className="font-medium">
                                        {microsoftData.drive.data.quota?.total
                                            ? `${Math.round(microsoftData.drive.data.quota.total / (1024 * 1024 * 1024))} GB`
                                            : "Not available"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500 text-sm">OneDrive access not available</p>
                                <p className="text-xs text-gray-400 mt-1">Additional permissions required</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Contacts Card - Now single column for cleaner layout */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <Users className="h-5 w-5 text-teal-600" />
                            </div>
                            Contacts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingStates.contacts ? (
                            <div className="space-y-3">
                                <div>
                                    <SkeletonLine className="h-3 w-20 mb-1" />
                                    <SkeletonLine className="h-8 w-8" />
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="border-l-2 border-gray-200 pl-3">
                                            <SkeletonLine className="h-4 w-24 mb-1" />
                                            <SkeletonLine className="h-3 w-32" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : microsoftData.contacts?.success &&
                          microsoftData.contacts.data &&
                          Array.isArray(microsoftData.contacts.data) ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Total Contacts</p>
                                    <p className="text-2xl font-bold text-teal-600">
                                        {microsoftData.contacts.data.length}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {microsoftData.contacts.data.slice(0, 3).map((contact, index) => (
                                        <div key={index} className="text-sm border-l-2 border-teal-200 pl-3">
                                            <p className="font-medium">{contact.displayName || "No Name"}</p>
                                            <p className="text-gray-500 text-xs">
                                                {contact.emailAddresses?.[0]?.address || "No Email"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500 text-sm">Contacts access not available</p>
                                <p className="text-xs text-gray-400 mt-1">Additional permissions required</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Mail Card - Wide layout, positioned last */}
                <Card className="hover:shadow-md transition-shadow md:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Mail className="h-5 w-5 text-purple-600" />
                            </div>
                            Mail
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingStates.messages ? (
                            <div className="space-y-3">
                                <div>
                                    <SkeletonLine className="h-3 w-24 mb-1" />
                                    <SkeletonLine className="h-8 w-8" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="border-l-2 border-gray-200 pl-3">
                                            <SkeletonLine className="h-4 w-32 mb-1" />
                                            <SkeletonLine className="h-3 w-20" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : microsoftData.messages?.success &&
                          microsoftData.messages.data &&
                          Array.isArray(microsoftData.messages.data) ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Recent Messages</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {microsoftData.messages.data.length}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {microsoftData.messages.data.slice(0, 4).map((message, index) => (
                                        <div key={index} className="text-sm border-l-2 border-purple-200 pl-3">
                                            <p className="font-medium">{message.subject || "No Subject"}</p>
                                            <p className="text-gray-500 text-xs">
                                                {message.from?.emailAddress?.name || "Unknown Sender"}
                                            </p>
                                            {message.receivedDateTime && (
                                                <p className="text-gray-400 text-xs mt-1">
                                                    {new Date(message.receivedDateTime).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500 text-sm">Mail access not available</p>
                                <p className="text-xs text-gray-400 mt-1">Additional permissions required</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
