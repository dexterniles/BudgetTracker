'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { deleteBill } from '@/app/(app)/bills/actions';

export function DeleteBillButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    modals.openConfirmModal({
      title: 'Delete bill',
      children: `Delete "${name}"? This will remove the bill and all payment history. This cannot be undone.`,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        startTransition(async () => {
          try {
            await deleteBill(id);
            notifications.show({ color: 'teal', message: 'Bill deleted.' });
            router.push('/bills');
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
