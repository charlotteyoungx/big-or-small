import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { sepolia } from 'viem/chains';

export const config = getDefaultConfig({
  appName: 'Big Or Small',
  projectId: import.meta.env.VITE_WC_PROJECT_ID as string,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

