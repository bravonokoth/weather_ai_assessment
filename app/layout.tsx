import Header from "./components/Header";
import Footer from "./components/Footer";
import Providers from "./providers";
import ThemeProvider from "./context/ThemeContext";
import { LocationProvider } from "./context/LocationContext";
import "./globals.css";

export const metadata = {
  title: "Weather AI Farming Assistant",
  description: "AI-powered farming recommendations for Kenyan farmers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
        <ThemeProvider>
          <LocationProvider>
            <Header />
            <Providers>
              <main className="flex-1 p-4 lg:p-8 overflow-auto">
                {children}
              </main>
            </Providers>
            <Footer />
          </LocationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
