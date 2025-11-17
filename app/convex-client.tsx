import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Get Convex URL from environment variable
const convexUrl = import.meta.env.VITE_CONVEX_URL!;

if (!convexUrl) {
  throw new Error(
    "Missing VITE_CONVEX_URL environment variable. Make sure .env.local exists with VITE_CONVEX_URL set."
  );
}

// Create Convex client
const convex = new ConvexReactClient(convexUrl);

// Provider component
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
