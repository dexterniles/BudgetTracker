'use client';

import NextLink from 'next/link';
import { Group, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  icon: ReactNode;
  label: string;
  color?: string;
};

export function QuickAction({ href, icon, label, color = 'teal' }: Props) {
  return (
    <UnstyledButton
      component={NextLink}
      href={href}
      style={{
        display: 'block',
        padding: 'var(--mantine-spacing-md)',
        borderRadius: 'var(--mantine-radius-lg)',
        border: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)',
        transition: 'transform 120ms ease, border-color 120ms ease',
      }}
      className="quick-action"
    >
      <Group gap="md" wrap="nowrap">
        <ThemeIcon variant="light" color={color} size={44} radius="xl">
          {icon}
        </ThemeIcon>
        <Text fw={500}>{label}</Text>
      </Group>
    </UnstyledButton>
  );
}
