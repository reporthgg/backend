"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  FileText,
  AlertTriangle,
  Shield,
  Settings,
  LogOut
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { logoutUser } from "@/actions/auth";
import { toast } from "sonner";

const navItems = [
  {
    name: "Оперативный чат",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    name: "Создание новостей",
    href: "/news",
    icon: FileText,
  },
  {
    name: "Инциденты",
    href: "/incidents",
    icon: AlertTriangle,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Ошибка при выходе из системы");
    }
  };

  return (
    <div className="h-full flex flex-col bg-blue-950 border-r border-gray-800 w-64 py-4">
      <div className="flex items-center justify-center gap-2 px-4 mb-6">
        <Shield className="text-blue-300 h-6 w-6" />
        <h1 className="text-xl font-semibold text-white">Полиция</h1>
      </div>

      <Separator className="bg-gray-700 mb-4" />

      <div className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "sidebar-item",
                  isActive && "active"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto px-3 py-4">
        <Separator className="bg-gray-700 mb-4" />
        <Link href="/settings" className="sidebar-item">
          <Settings className="h-5 w-5" />
          <span>Настройки</span>
        </Link>
        <button onClick={handleLogout} className="sidebar-item mt-2 w-full text-left">
          <LogOut className="h-5 w-5" />
          <span>Выход</span>
        </button>
      </div>
    </div>
  );
}
