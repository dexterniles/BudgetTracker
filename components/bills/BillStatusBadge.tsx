import { Badge } from '@mantine/core';
import type { Bill } from '@/types/database';

const colors: Record<Bill['status'], string> = {
  unpaid: 'gray',
  partial: 'yellow',
  paid: 'teal',
};

const labels: Record<Bill['status'], string> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
};

export function BillStatusBadge({ status }: { status: Bill['status'] }) {
  return (
    <Badge variant="light" color={colors[status]}>
      {labels[status]}
    </Badge>
  );
}
