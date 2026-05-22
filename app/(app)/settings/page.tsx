import { Stack } from '@mantine/core';
import { getUserSettings } from '@/lib/settings';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <Stack gap="lg">
      <PageHeader title="Settings" description="Configure your pay schedule." />
      <SectionCard title="Pay schedule">
        <SettingsForm
          initialAnchor={settings?.pay_anchor_date ?? null}
          initialCurrency={settings?.currency ?? 'USD'}
        />
      </SectionCard>
    </Stack>
  );
}
