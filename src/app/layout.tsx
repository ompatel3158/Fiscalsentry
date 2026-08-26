import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ChatProvider } from '@/context/ChatContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'FiscalSentry | Autonomous Financial & Paperwork Action Engine',
  description:
    'Autonomous 24/7 background agent built for Google All Things Agentic (Taskmaster) Hackathon. Ingests, audits, and executes real-world actions for messy financial paperwork across Google Workspace and Slack.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AppProvider>
              <ChatProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    className:
                      'rounded-2xl backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white shadow-lg text-xs',
                    duration: 4000,
                  }}
                  richColors
                  closeButton
                />
              </ChatProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
