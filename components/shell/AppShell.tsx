'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ActionIcon,
  AppShell as MantineAppShell,
  Burger,
  Divider,
  Group,
  Menu,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconCalendar,
  IconCash,
  IconChartBar,
  IconCoin,
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

type IconComp = React.ComponentType<{ size?: number | string; stroke?: number }>;
type NavItem = { label: string; href: string; icon: IconComp };

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: IconLayoutDashboard },
  { label: 'Bills', href: '/bills', icon: IconReceipt2 },
  { label: 'Income', href: '/income', icon: IconCash },
  { label: 'Loans', href: '/loans', icon: IconWallet },
  { label: 'Calendar', href: '/calendar', icon: IconCalendar },
  { label: 'Reports', href: '/reports', icon: IconChartBar },
];

const SECONDARY_NAV: NavItem[] = [{ label: 'Settings', href: '/settings', icon: IconSettings }];

const MOBILE_TABS = NAV.slice(0, 4);

function SidebarItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <UnstyledButton
      component={Link}
      href={item.href}
      onClick={onClick}
      className="sidebar-item"
      data-active={active || undefined}
    >
      <Group gap="sm" wrap="nowrap">
        <Icon size={18} />
        <Text size="sm" fw={500}>
          {item.label}
        </Text>
      </Group>
    </UnstyledButton>
  );
}

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
      header={{ height: 60 }}
      navbar={{
        width: 248,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: false },
      }}
      footer={isMobile ? { height: 64 } : undefined}
      padding="lg"
    >
      <MantineAppShell.Header
        withBorder={false}
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <ThemeIcon variant="light" color="teal" size={32} radius="md">
              <IconCoin size={18} />
            </ThemeIcon>
            <Text fw={700} size="md">
              Budget
              <Text component="span" c="teal" inherit>
                Tracker
              </Text>
            </Text>
          </Group>
          <Group gap="xs">
            <Menu shadow="md" width={200} position="bottom-end" radius="md">
              <Menu.Target>
                <ActionIcon variant="filled" color="teal" size="lg" radius="md" aria-label="Add">
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
              color="gray"
              onClick={toggleColorScheme}
              size="lg"
              aria-label="Toggle color scheme"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar
        p="md"
        withBorder={false}
        style={{ borderRight: '1px solid var(--mantine-color-default-border)' }}
      >
        <MantineAppShell.Section grow component={ScrollArea}>
          <Text
            size="xs"
            c="dimmed"
            tt="uppercase"
            fw={600}
            mb="xs"
            style={{ letterSpacing: 0.4 }}
          >
            Menu
          </Text>
          <Stack gap={4}>
            {NAV.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={close}
              />
            ))}
          </Stack>
        </MantineAppShell.Section>
        <MantineAppShell.Section>
          <Divider my="sm" />
          <Stack gap={4}>
            {SECONDARY_NAV.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={close}
              />
            ))}
            <UnstyledButton
              onClick={handleSignOut}
              className="sidebar-item"
            >
              <Group gap="sm" wrap="nowrap">
                <IconLogout size={18} />
                <Text size="sm" fw={500}>
                  Sign out
                </Text>
              </Group>
            </UnstyledButton>
          </Stack>
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main pb={isMobile ? 84 : undefined}>{children}</MantineAppShell.Main>

      {isMobile && (
        <MantineAppShell.Footer
          withBorder={false}
          style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
        >
          <Group h="100%" gap={0} grow preventGrowOverflow={false}>
            {MOBILE_TABS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <UnstyledButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  className="mobile-tab"
                  data-active={active || undefined}
                >
                  <Icon size={20} />
                  <Text size="xs" mt={4} fw={500}>
                    {item.label}
                  </Text>
                </UnstyledButton>
              );
            })}
            <Menu position="top-end" shadow="md" radius="md">
              <Menu.Target>
                <UnstyledButton className="mobile-tab">
                  <IconPlus size={20} />
                  <Text size="xs" mt={4} fw={500}>
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
    </MantineAppShell>
  );
}
