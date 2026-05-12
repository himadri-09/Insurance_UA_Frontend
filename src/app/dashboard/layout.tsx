"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Shield, LayoutDashboard, Upload, FileText, BookOpen, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "New Submission", icon: Upload },
  { href: "/dashboard/submissions", label: "Submissions", icon: FileText },
  { href: "/dashboard/appetite", label: "Knowledge Base", icon: BookOpen },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/auth");
      else setUser(session.user);
      setLoading(false);
    });
  }, [router]);

  const handleSignOut = async () => { const supabase = createClient(); await supabase.auth.signOut(); router.replace("/auth"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-subtle-pulse text-gray-600 font-mono text-sm">Loading...</div></div>;

  return (
    <div className="min-h-screen flex bg-white">
      <aside className="w-64 bg-gray-100 border-r border-gray-300 flex flex-col fixed h-full">
        <div className="p-5 border-b border-gray-300"><div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div><span className="text-lg font-bold text-gray-900">TriagePilot</span></div></div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${active ? "bg-black text-white border border-gray-400" : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"}`}><item.icon className="w-4 h-4" /><span className="flex-1">{item.label}</span>{active && <ChevronRight className="w-3 h-3 opacity-70" />}</Link>;
          })}
        </nav>
        <div className="p-4 border-t border-gray-300"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-900">{user?.email?.[0]?.toUpperCase() || "U"}</div><div className="flex-1 min-w-0"><div className="text-sm text-gray-800 truncate">{user?.email || "User"}</div></div><button onClick={handleSignOut} className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors" title="Sign out"><LogOut className="w-4 h-4" /></button></div></div>
      </aside>
      <main className="flex-1 ml-64 p-8 bg-white">{children}</main>
    </div>
  );
}
