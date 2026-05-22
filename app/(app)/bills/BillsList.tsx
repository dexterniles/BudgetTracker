'use client';

import { useMemo, useState } from 'react';
import { Group, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { BillCard } from '@/components/bills/BillCard';
import type { Bill } from '@/types/database';

type Filter = 'all' | 'unpaid' | 'partial' | 'paid';

export function BillsList({ bills }: { bills: Bill[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bills.filter((b) => {
      if (filter !== 'all' && b.status !== filter) return false;
      if (q && !b.name.toLowerCase().includes(q) && !(b.category ?? '').toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [bills, filter, query]);

  return (
    <Stack gap="md">
      <Group gap="sm" wrap="wrap">
        <SegmentedControl
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Unpaid', value: 'unpaid' },
            { label: 'Partial', value: 'partial' },
            { label: 'Paid', value: 'paid' },
          ]}
        />
        <TextInput
          placeholder="Search"
          leftSection={<IconSearch size={14} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
      </Group>
      {filtered.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No bills match.
        </Text>
      ) : (
        <Stack gap="sm">
          {filtered.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
