import type { Metadata } from 'next';
import { Noto_Serif_JP, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'], // 確保使用有效的子集 (latin 通常已包含日文所需字符，或者 next/font 會處理)
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif-jp',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '花札道場 - 學習花札',
  description: '透過課程、測驗和AI分析來掌握花札（こいこい）。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`${notoSerifJP.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
