import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { RetryButton } from './RetryButton';

const meta: Meta<typeof RetryButton> = {
  component: RetryButton,
  title: 'Components/RetryButton',
  tags: ['autodocs'],
  args: {
    onClick: () => {},
    loading: false,
    children: 'Retry',
  },
};

export default meta;
type Story = StoryObj<typeof RetryButton>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const LoadingAndDisabled: Story = {
  args: { loading: true, disabled: true },
};
