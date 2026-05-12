import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from './Icon';

const meta: Meta<typeof Icon> = {
  component: Icon,
  title: 'Components/Icon',
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Retry: Story = {
  args: { source: 'retry' },
};

export const Download: Story = {
  args: { source: 'download' },
};

export const Spinner: Story = {
  args: { source: 'spinner' },
};
