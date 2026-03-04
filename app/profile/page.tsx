"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProfileView from "@/components/ProfileView";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div
          className="animate-spin w-10 h-10 border-2 rounded-full"
          style={{ borderColor: "var(--f1-red)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!session?.user?.id) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="border-b py-6 px-4" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>
              Your Profile
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Manage your account and view prediction history
            </p>
          </div>
          <Link
            href="/"
            className="text-sm hover:underline"
            style={{ color: "var(--muted)" }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProfileView userId={session.user.id} isSelf={true} />
      </div>
    </div>
  );
}
