'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { deleteLoan } from '@/app/(app)/loans/actions';

export function DeleteLoanButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    modals.openConfirmModal({
      title: 'Delete loan',
      children: `Delete "${name}" and all its payment history? This cannot be undone.`,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        startTransition(async () => {
          try {
            await deleteLoan(id);
            notifications.show({ color: 'teal', message: 'Loan deleted.' });
            router.push('/loans');
          } catch (err) {
            notifications.show({
              color: 'red',
              message: err instanceof Error ? err.message : 'Delete failed',
            });
          }
        });
      },
    });
  }

  return (
    <Button
      variant="subtle"
      color="red"
      onClick={handleClick}
      loading={pending}
      leftSection={<IconTrash size={14} />}
    >
      Delete
    </Button>
  );
}
