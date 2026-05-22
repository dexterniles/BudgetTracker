import { Stack, Title, Text } from '@mantine/core';
import { getUserSettings } from '@/lib/settings';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Settings</Title>
        <Text c="dimmed">Configure your pay schedule.</Text>
      </div>
      <SettingsForm
        initialAnchor={settings?.pay_anchor_date ?? null}
        initialCurrency={settings?.currency ?? 'USD'}
      />
    </Stack>
  );
}
