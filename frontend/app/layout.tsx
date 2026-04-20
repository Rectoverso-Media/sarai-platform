import './globals.css'; 
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}