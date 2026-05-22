import { Stack, Title } from '@mantine/core';
import { LoanForm } from '@/components/loans/LoanForm';

export default function NewLoanPage() {
  return (
    <Stack gap="md">
      <Title order={2}>New loan</Title>
      <LoanForm />
    </Stack>
  );
}
