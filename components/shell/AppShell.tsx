'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ActionIcon,
  AppShell as MantineAppShell,
  Box,
  Burger,
  Group,
  Menu,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconCalendar,
  IconCash,
  IconChartBar,
  IconLayoutDashboard,
  IconLogout,
  IconMoon,
  IconPlus,
  IconReceipt2,
  IconSettings,
  IconSun,
  IconWallet,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number | string; stroke?: number }>;
};

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: IconLayoutDashboard },
  { label: 'Bills', href: '/bills', icon: IconReceipt2 },
  { label: 'Income', href: '/income', icon: IconCash },
  { label: 'Loans', href: '/loans', icon: IconWallet },
  { label: 'Calendar', href: '/calendar', icon: IconCalendar },
  { label: 'Reports', href: '/reports', icon: IconChartBar },
];

const MOBILE_TABS = NAV.slice(0, 4);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <MantineAppShell
      header={{ height: 56 }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: false },
      }}
      footer={isMobile ? { height: 60 } : undefined}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>Budget Tracker</Title>
          </Group>
          <Group gap="xs">
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="filled" color="teal" size="lg" radius="xl" aria-label="Add">
                  <IconPlus size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Quick add</Menu.Label>
                <Menu.Item leftSection={<IconReceipt2 size={16} />} component={Link} href="/bills/new">
                  New bill
                </Menu.Item>
                <Menu.Item leftSection={<IconCash size={16} />} component={Link} href="/income/new">
                  New income
                </Menu.Item>
                <Menu.Item leftSection={<IconWallet size={16} />} component={Link} href="/loans/new">
                  New loan
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <ActionIcon
              variant="subtle"
              onClick={toggleColorScheme}
              size="lg"
              aria-label="Toggle color scheme"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="xs">
        <MantineAppShell.Section grow component={ScrollArea}>
          <Stack gap={4}>
            {NAV.map((item) => (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.label}
                leftSection={<item.icon size={18} />}
                active={isActive(item.href)}
                onClick={close}
              />
            ))}
          </Stack>
        </MantineAppShell.Section>
        <MantineAppShell.Section>
          <Stack gap={4}>
            <NavLink
              component={Link}
              href="/settings"
              label="Settings"
              leftSection={<IconSettings size={18} />}
              active={isActive('/settings')}
              onClick={close}
            />
            <NavLink
              label="Sign out"
              leftSection={<IconLogout size={18} />}
              onClick={handleSignOut}
            />
          </Stack>
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main pb={isMobile ? 80 : undefined}>{children}</MantineAppShell.Main>

      {isMobile && (
        <MantineAppShell.Footer>
          <Group h="100%" gap={0} grow preventGrowOverflow={false}>
            {MOBILE_TABS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <UnstyledButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: active ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-dimmed)',
                  }}
                >
                  <Icon size={20} />
                  <Text size="xs" mt={2}>
                    {item.label}
                  </Text>
                </UnstyledButton>
              );
            })}
            <Menu position="top-end" shadow="md">
              <Menu.Target>
                <UnstyledButton
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--mantine-color-dimmed)',
                  }}
                >
                  <IconPlus size={20} />
                  <Text size="xs" mt={2}>
                    Add
                  </Text>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item component={Link} href="/bills/new" leftSection={<IconReceipt2 size={16} />}>
                  New bill
                </Menu.Item>
                <Menu.Item component={Link} href="/income/new" leftSection={<IconCash size={16} />}>
                  New income
                </Menu.Item>
                <Menu.Item component={Link} href="/loans/new" leftSection={<IconWallet size={16} />}>
                  New loan
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </MantineAppShell.Footer>
      )}
      <Box />
    </MantineAppShell>
  );
}
