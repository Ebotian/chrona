import type { Metadata } from 'next';
import './globals.css';
import GlobalBgAudio from '../components/GlobalBgAudio';

export const metadata: Metadata = {
  title: 'Chrono-Stasis',
  description: 'Synthwave vector constellation archive.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <GlobalBgAudio />
      </body>
    </html>
  );
}
