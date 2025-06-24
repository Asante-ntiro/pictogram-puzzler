"use client";

import { type ReactNode } from "react";
import { celoAlfajores, hardhat } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { createConfig, WagmiProvider } from "wagmi";
import { injected } from 'wagmi/connectors'

import { http } from "viem";

// Create config for local development
const localConfig = createConfig({
  chains: [hardhat],
  connectors: [
    injected(),],
  transports: {
    [hardhat.id]: http(),
  },
});

const testnetConfig = createConfig({
  chains: [celoAlfajores],
  connectors: [
    injected(),],
  transports: {
    [celoAlfajores.id]: http(),
  }
})

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export function Providers(props: { children: ReactNode }) {
  return (
    <>
      {/* For local development, wrap with WagmiConfig using hardhat chain */}
      {isDevelopment ? (
        <WagmiProvider config={localConfig}>
          <MiniKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={hardhat}
            config={{
              appearance: {
                mode: "auto",
                theme: "mini-app-theme",
                name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Pictogram Puzzler",
                logo: process.env.NEXT_PUBLIC_ICON_URL,
              },
            }}
          >
            {props.children}
          </MiniKitProvider>
        </WagmiProvider>
      ) : (
        <WagmiProvider config={testnetConfig}>
        <MiniKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={celoAlfajores}
          config={{
            appearance: {
              mode: "auto",
              theme: "mini-app-theme",
              name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Pictogram Puzzler",
              logo: process.env.NEXT_PUBLIC_ICON_URL,
            },
          }}
        >
          {props.children}
        </MiniKitProvider>
        </WagmiProvider>
      )}
    </>
  );
}
