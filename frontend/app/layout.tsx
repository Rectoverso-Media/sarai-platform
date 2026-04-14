import './globals.css'; // Sesuaikan path-nya dengan letak file globals.css kamu
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}