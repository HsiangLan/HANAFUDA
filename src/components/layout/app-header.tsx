
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, UserCircle, LogOut, Menu, X, Settings, LayoutGrid, BookOpen, Target, Gamepad2, ListChecks, Brain } from 'lucide-react';

import { signOut } from 'firebase/auth'; 
import { auth } from '@/lib/firebase'; 

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from "@/hooks/use-mobile";


const navItems = [
  { href: '/dashboard', label: '首頁', icon: LayoutGrid },
  { href: '/dashboard/lessons', label: '課程', icon: BookOpen },
  { href: '/dashboard/trainer', label: '情境練習', icon: Target },
  { href: '/dashboard/progress', label: '進度紀錄', icon: ListChecks },
  { href: '/dashboard/play-ai', label: 'AI 對戰', icon: Brain },
  { href: '/dashboard/play', label: '實際操作', icon: Gamepad2 },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: '已登出',
        description: '您已成功登出。',
      });
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: '登出失敗',
        description: '登出時發生錯誤，請稍後再試。',
      });
    }
  };
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-header bg-header px-4 md:px-6">
      {/* Left Section: Logo and Desktop Nav */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="https://placehold.co/32x32.png" 
            alt="花札道場 Logo" 
            width={32} 
            height={32} 
            className="rounded-sm"
            data-ai-hint="logo hanafuda"
          />
          <span className="hidden text-xl font-semibold text-header-foreground md:block">
            花札道場
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-4 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith(item.href) && (item.href === '/dashboard' ? pathname === item.href : true)
                  ? "text-header-active-foreground font-semibold" // Active
                  : "text-header-foreground opacity-80 hover:opacity-100 hover:text-header-hover-foreground" // Inactive
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right Section: Actions and Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full text-header-foreground hover:bg-header-hover hover:text-header-hover-foreground" aria-label="通知">
          <Bell className="h-5 w-5" />
          <span className="sr-only">通知</span>
        </Button>
        
        {/* Desktop User Menu */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-header-foreground hover:bg-header-hover hover:text-header-hover-foreground" aria-label="使用者選單">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56"> {/* Uses default popover styling */}
              <DropdownMenuLabel>我的帳戶</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">個人資料</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">設定</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>登出</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Trigger & Content */}
        <div className="md:hidden">
          <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-header-foreground hover:bg-header-hover hover:text-header-hover-foreground"
                aria-label="開啟主選單"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56"> {/* Uses default popover styling */}
              <DropdownMenuLabel>導覽</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>帳戶</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <UserCircle className="mr-2 h-4 w-4" /> 個人資料
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)}>
                    <Settings className="mr-2 h-4 w-4" /> 設定
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
