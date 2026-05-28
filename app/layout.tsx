import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tra cứu cây xăng A97",
  description: "Tìm và đóng góp vị trí cây xăng bán A97 tại Việt Nam."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
