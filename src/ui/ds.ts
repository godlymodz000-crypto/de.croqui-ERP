import type { ComponentType, CSSProperties, MouseEvent, ReactNode } from 'react';
import './react-global';
import '../design-system/_ds_bundle.js';

// Tipos copiados dos .d.ts do design system (components/*), só com o que o ERP usa.
export interface ButtonProps {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'light' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: string;
  iconRight?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  'aria-busy'?: boolean;
}

export interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  title?: string;
  style?: CSSProperties;
}

export interface BadgeProps {
  children?: ReactNode;
  tone?: 'neutral' | 'brand' | 'navy' | 'slate' | 'success' | 'warning' | 'danger';
  dot?: boolean;
  style?: CSSProperties;
}

interface DesignSystem {
  Button: ComponentType<ButtonProps>;
  Icon: ComponentType<IconProps>;
  Badge: ComponentType<BadgeProps>;
  ICON_NAMES: string[];
}

const ds = (window as unknown as { DeCroquiDesignSystem_5f8fc8: DesignSystem }).DeCroquiDesignSystem_5f8fc8;

export const { Button, Icon, Badge, ICON_NAMES } = ds;
