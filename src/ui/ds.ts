import type { ChangeEvent, ComponentType, CSSProperties, MouseEvent, ReactNode } from 'react';
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

export interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: 'text' | 'email' | 'search' | 'date';
  multiline?: boolean;
  rows?: number;
  variant?: 'line' | 'box';
  iconLeft?: string;
  disabled?: boolean;
  id?: string;
  style?: CSSProperties;
}

export interface SelectProps {
  label?: string;
  options: Array<string | { value: string; label: string }>;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  variant?: 'line' | 'box';
  disabled?: boolean;
  hint?: string;
  id?: string;
  style?: CSSProperties;
}

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  eyebrow?: string;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export interface ToastProps {
  title?: string;
  message?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  action?: ReactNode;
  onClose?: () => void;
  style?: CSSProperties;
}

export interface IconButtonProps {
  icon: string;
  label: string;
  variant?: 'outline' | 'filled' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
}

export interface ArchFrameProps {
  src?: string;
  alt?: string;
  shape?: 'arch' | 'soft' | 'rect' | 'round';
  ratio?: string;
  label?: string;
  tone?: 'stone' | 'slate' | 'wine' | 'night';
  style?: CSSProperties;
}

export interface TagProps {
  children?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

interface DesignSystem {
  Button: ComponentType<ButtonProps>;
  Icon: ComponentType<IconProps>;
  Badge: ComponentType<BadgeProps>;
  Input: ComponentType<InputProps>;
  Select: ComponentType<SelectProps>;
  Dialog: ComponentType<DialogProps>;
  Toast: ComponentType<ToastProps>;
  IconButton: ComponentType<IconButtonProps>;
  ArchFrame: ComponentType<ArchFrameProps>;
  Tag: ComponentType<TagProps>;
  ICON_NAMES: string[];
}

const ds = (window as unknown as { DeCroquiDesignSystem_5f8fc8: DesignSystem }).DeCroquiDesignSystem_5f8fc8;

export const { Button, Icon, Badge, Input, Select, Dialog, Toast, IconButton, ArchFrame, Tag, ICON_NAMES } = ds;
