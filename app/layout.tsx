import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "座禅-zazen-｜記録の管理",
  description: "代表・伏谷の活動日記、写真、お知らせを更新する管理画面。",
  icons: {
    icon: "/assets/favicon.svg",
    shortcut: "/assets/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
