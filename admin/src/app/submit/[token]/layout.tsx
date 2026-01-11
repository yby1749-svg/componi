'use client';

import { ThemeProvider } from '@/components/ThemeProvider';

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    </ThemeProvider>
  );
}
