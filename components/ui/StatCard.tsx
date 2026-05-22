import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon?: ReactNode;
  color?: string;
  valueColor?: string;
};

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  color = 'teal',
  valueColor,
}: Props) {
  return (
    <Card>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: 0.4 }}>
            {label}
          </Text>
          <Text fz={26} fw={700} c={valueColor}>
            {value}
          </Text>
          {sublabel && (
            <Text size="xs" c="dimmed">
              {sublabel}
            </Text>
          )}
        </Stack>
        {icon && (
          <ThemeIcon variant="light" color={color} size={42} radius="xl">
            {icon}
          </ThemeIcon>
        )}
      </Group>
    </Card>
  );
}
