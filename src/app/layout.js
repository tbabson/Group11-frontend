import { Inter, Montserrat, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/auth';
import { SITE } from '@/lib/site';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-jakarta' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-montserrat' });

export const metadata = {
  title: { default: `${SITE.name} ${SITE.suffix} | ${SITE.tagline}`, template: `%s | ${SITE.name} ${SITE.suffix}` },
  description: 'Discover and book premium events: galas, conferences, weddings and VIP experiences. Organizers sell tickets and check guests in with QR codes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${montserrat.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
