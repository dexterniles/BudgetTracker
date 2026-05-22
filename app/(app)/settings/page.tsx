import { Stack } from '@mantine/core';
import { getUserSettings } from '@/lib/settings';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { SettingsForm } from './SettingsForm';
import { PasswordForm } from './PasswordForm';

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <Stack gap="lg">
      <PageHeader title="Settings" description="Pay schedule and account." />
      <SectionCard title="Pay schedule">
        <SettingsForm
          initialAnchor={settings?.pay_anchor_date ?? null}
          initialCurrency={settings?.currency ?? 'USD'}
        />
      </SectionCard>
      <SectionCard title="Password">
        <PasswordForm />
      </SectionCard>
    </Stack>
  );
}
