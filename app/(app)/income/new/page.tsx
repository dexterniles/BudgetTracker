import { Stack, Title } from '@mantine/core';
import { IncomeForm } from '@/components/income/IncomeForm';

export default function NewIncomePage() {
  return (
    <Stack gap="md">
      <Title order={2}>New income</Title>
      <IncomeForm />
    </Stack>
  );
}
