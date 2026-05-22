'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCoin, IconMail } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { createClient } from '@/lib/supabase/client';

type Mode = 'password' | 'magic';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/');
      router.refresh();
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

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMagicSent(true);
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
                  {mode === 'password'
                    ? 'Use your email and password.'
                    : "We'll email you a one-time sign-in link."}
                </Text>
              </div>

              {mode === 'magic' && magicSent ? (
                <Alert
                  color="teal"
                  variant="light"
                  icon={<IconMail size={16} />}
                  radius="md"
                  title="Check your inbox"
                >
                  We sent a sign-in link to <b>{email}</b>. Open it on this device to continue.
                </Alert>
              ) : mode === 'password' ? (
                <form onSubmit={handlePasswordSubmit}>
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
                    <PasswordInput
                      label="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.currentTarget.value)}
                    />
                    <Button type="submit" loading={loading} fullWidth size="md">
                      Sign in
                    </Button>
                  </Stack>
                </form>
              ) : (
                <form onSubmit={handleMagicSubmit}>
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

              <Text size="xs" c="dimmed" ta="center">
                {mode === 'password' ? (
                  <>
                    Don&apos;t have a password yet?{' '}
                    <Anchor
                      size="xs"
                      onClick={() => {
                        setMode('magic');
                        setMagicSent(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      Sign in with a magic link
                    </Anchor>{' '}
                    and set one in Settings.
                  </>
                ) : (
                  <Anchor
                    size="xs"
                    onClick={() => {
                      setMode('password');
                      setMagicSent(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    ← Back to password sign-in
                  </Anchor>
                )}
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Center>
  );
}
