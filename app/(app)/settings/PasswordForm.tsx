'use client';

import { useState } from 'react';
import { Button, Group, PasswordInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createClient } from '@/lib/supabase/client';

export function PasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      notifications.show({ color: 'red', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== confirm) {
      notifications.show({ color: 'red', message: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirm('');
      notifications.show({ color: 'teal', message: 'Password updated.' });
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof Error ? err.message : 'Failed',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack maw={420}>
        <Text size="sm" c="dimmed">
          Set or change the password you use to sign in. Minimum 8 characters.
        </Text>
        <PasswordInput
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.currentTarget.value)}
          required
          autoComplete="new-password"
        />
        <Group justify="flex-end">
          <Button type="submit" loading={loading}>
            Update password
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
