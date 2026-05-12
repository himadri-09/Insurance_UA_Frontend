"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      router.replace(session ? "/dashboard" : "/auth");
    };
    check();
  }, [router]);
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-subtle-pulse text-ink-400 font-mono text-sm">Loading...</div></div>;
}
