'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCoin, IconMail } from '@tabler/icons-react';
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
        <Stack gap="lg">
          <Group justify="center" gap="sm">
            <ThemeIcon variant="light" color="teal" size={40} radius="md">
              <IconCoin size={22} />
            </ThemeIcon>
            <Text fw={700} size="xl">
              Budget
              <Text component="span" c="teal" inherit>
                Tracker
              </Text>
            </Text>
          </Group>
          <Paper p="xl" radius="lg" withBorder>
            <Stack>
              <div>
                <Title order={3}>Sign in</Title>
                <Text c="dimmed" size="sm">
                  We&apos;ll email you a magic link — no password required.
                </Text>
              </div>
              {sent ? (
                <Alert
                  color="teal"
                  variant="light"
                  icon={<IconMail size={16} />}
                  radius="md"
                  title="Check your inbox"
                >
                  We sent a sign-in link to <b>{email}</b>. Open it on this device to continue.
                </Alert>
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
                    <Button type="submit" loading={loading} fullWidth size="md">
                      Send magic link
                    </Button>
                  </Stack>
                </form>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Center>
  );
}
