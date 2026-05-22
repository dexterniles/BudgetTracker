import { Stack, Title } from '@mantine/core';
import { BillForm } from '@/components/bills/BillForm';

export default function NewBillPage() {
  return (
    <Stack gap="md">
      <Title order={2}>New bill</Title>
      <BillForm />
    </Stack>
  );
}
