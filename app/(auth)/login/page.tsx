'use client';

import { useState } from 'react';
import {
  Button,
  Center,
  Container,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Sign-in failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center mih="100vh" p="md">
      <Container size={420} w="100%">
        <Paper p="xl" radius="md" withBorder shadow="md">
          <Stack>
            <div>
              <Title order={2}>Budget Tracker</Title>
              <Text c="dimmed" size="sm">
                Sign in with a magic link
              </Text>
            </div>
            {sent ? (
              <Text>
                Check <b>{email}</b> for a sign-in link.
              </Text>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack>
                  <TextInput
                    label="Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    placeholder="you@example.com"
                    autoFocus
                  />
                  <Button type="submit" loading={loading} fullWidth>
                    Send magic link
                  </Button>
                </Stack>
              </form>
            )}
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
