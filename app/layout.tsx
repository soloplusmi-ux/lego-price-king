import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "乐高比价王 - Lego Price King",
  description: "乐高套装价格比较和追踪平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  );
}
