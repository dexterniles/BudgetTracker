'use client';

import NextLink from 'next/link';
import {
  ActionIcon,
  type ActionIconProps,
  Anchor,
  type AnchorProps,
  Button,
  type ButtonProps,
  Card,
  type CardProps,
  Menu,
} from '@mantine/core';
import type { ComponentProps, ReactNode } from 'react';

type WithHref = { href: string; children?: ReactNode };

export function LinkAnchor(props: AnchorProps & WithHref) {
  return <Anchor component={NextLink} {...props} />;
}

export function LinkButton(props: ButtonProps & WithHref) {
  return <Button component={NextLink} {...props} />;
}

export function LinkCard(props: CardProps & WithHref & { style?: React.CSSProperties }) {
  return <Card component={NextLink} {...props} />;
}

export function LinkActionIcon(props: ActionIconProps & WithHref & { 'aria-label'?: string }) {
  return <ActionIcon component={NextLink} {...props} />;
}

export function LinkMenuItem(props: ComponentProps<typeof Menu.Item> & WithHref) {
  return <Menu.Item component={NextLink} {...props} />;
}
