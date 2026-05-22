import { Card, Divider, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  padding?: number | string;
};

export function SectionCard({ title, action, children, padding }: Props) {
  return (
    <Card padding={0}>
      {title && (
        <>
          <Group justify="space-between" px="lg" py="md" gap="sm" wrap="nowrap">
            <Text fw={600} size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 0.4 }}>
              {title}
            </Text>
            {action}
          </Group>
          <Divider />
        </>
      )}
      <div style={{ padding: padding ?? 'var(--mantine-spacing-lg)' }}>{children}</div>
    </Card>
  );
}
