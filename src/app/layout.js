import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const font = Inter({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800']
});

export const metadata = {
  title: "SkyRelief Admin ERP",
  description: "Admin ERP for SkyRelief Foundation",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/favicon-v2.png',
    shortcut: '/favicon-v2.png',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
