import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { sepolia } from 'viem/chains';

export const config = getDefaultConfig({
  appName: 'Big Or Small',
  projectId: "Your ID",
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
  },
});
