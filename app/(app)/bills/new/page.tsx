import { Stack } from '@mantine/core';
import { BillForm } from '@/components/bills/BillForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { LinkAnchor } from '@/components/ui/links';

export default function NewBillPage() {
  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <LinkAnchor href="/bills" size="sm">
          ← Back to bills
        </LinkAnchor>
        <PageHeader title="New bill" description="Track a one-off or installment expense." />
      </Stack>
      <SectionCard>
        <BillForm />
      </SectionCard>
    </Stack>
  );
}
