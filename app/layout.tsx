import type { Metadata } from 'next';
import Script from 'next/script';
import { MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { DatesProvider } from '@mantine/dates';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

import { theme } from '@/theme';

export const metadata: Metadata = {
  title: 'Budget Tracker',
  description: 'Personal bill, income, and loan tracking',
};

const colorSchemeScript = `(function() {
  try {
    var raw = localStorage.getItem('mantine-color-scheme-value');
    var scheme = raw ? JSON.parse(raw) : 'dark';
    if (scheme === 'auto') {
      scheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
  } catch (_) {
    document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Script id="mantine-color-scheme" strategy="beforeInteractive">
          {colorSchemeScript}
        </Script>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <DatesProvider settings={{ firstDayOfWeek: 0 }}>
            <ModalsProvider>
              <Notifications position="top-right" />
              {children}
            </ModalsProvider>
          </DatesProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
