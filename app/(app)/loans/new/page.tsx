import { Stack } from '@mantine/core';
import { LoanForm } from '@/components/loans/LoanForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { LinkAnchor } from '@/components/ui/links';

export default function NewLoanPage() {
  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <LinkAnchor href="/loans" size="sm">
          ← Back to loans
        </LinkAnchor>
        <PageHeader title="New loan" description="Student loan, car payment, phone installment, etc." />
      </Stack>
      <SectionCard>
        <LoanForm />
      </SectionCard>
    </Stack>
  );
}
