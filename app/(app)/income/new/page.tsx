import { Stack } from '@mantine/core';
import { IncomeForm } from '@/components/income/IncomeForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { LinkAnchor } from '@/components/ui/links';

export default function NewIncomePage() {
  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <LinkAnchor href="/income" size="sm">
          ← Back to income
        </LinkAnchor>
        <PageHeader title="New income" description="A paycheck, marketplace sale, or side gig." />
      </Stack>
      <SectionCard>
        <IncomeForm />
      </SectionCard>
    </Stack>
  );
}
