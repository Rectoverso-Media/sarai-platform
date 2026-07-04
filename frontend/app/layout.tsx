import './globals.css';
import { Toaster } from 'react-hot-toast';
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'SARAI - Automasi Reporting untuk Bisnis Indonesia',
  description: 'Platform automasi reporting yang membantu bisnis Indonesia menghemat waktu dan mendapatkan insight dari data marketing dengan mudah.',
  keywords: 'reporting automation, marketing data, Indonesia, SME, agency, analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable}`}>
      <body className="antialiased min-h-screen bg-[#F8FAFC]">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
