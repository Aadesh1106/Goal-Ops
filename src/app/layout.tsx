import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavigationRedirectListener from '@/components/NavigationRedirectListener';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'GoalOps Enterprise',
    template: '%s | GoalOps Enterprise',
  },
  description:
    'Operational Goal Governance & Performance Intelligence Platform — centralize, track and govern enterprise goals with precision.',
  keywords: ['goal management', 'OKR', 'performance', 'enterprise', 'governance'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <NavigationRedirectListener />
        {children}
      </body>
    </html>
  );
}
