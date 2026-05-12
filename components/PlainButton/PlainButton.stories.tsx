import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PlainButton } from './PlainButton';

const meta: Meta<typeof PlainButton> = {
  component: PlainButton,
  title: 'Components/PlainButton',
  tags: ['autodocs'],
  args: { onClick: () => {} },
};

export default meta;
type Story = StoryObj<typeof PlainButton>;

export const Default: Story = {
  args: { children: 'Click me' },
};

export const WithDownloadIcon: Story = {
  args: { children: 'Download Invoice', icon: 'download' },
};

export const WithRetryIcon: Story = {
  args: { children: 'Retry', icon: 'retry' },
};

export const Loading: Story = {
  args: { children: 'Processing…', loading: true },
};

export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
};

export const WithRetryIconDisabled: Story = {
  args: { children: 'Retry', icon: 'retry', disabled: true },
};

export const WithRetryIconLoading: Story = {
  args: { children: 'Retry', icon: 'retry', loading: true },
};
