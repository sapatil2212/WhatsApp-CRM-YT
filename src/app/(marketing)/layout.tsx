import React from "react";
import { AuroraBackground } from "@/components/marketing/aurora-background";
import { GlassNavbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { MarketingThemeProvider } from "@/components/marketing/marketing-theme-provider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingThemeProvider>
      <AuroraBackground showRadialGlows={true}>
        <GlassNavbar />
        <main className="flex-1 w-full flex flex-col pt-20">
          {children}
        </main>
        <Footer />
      </AuroraBackground>
    </MarketingThemeProvider>
  );
}
