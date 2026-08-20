import './globals.css';

export const metadata = {
  title: 'Aegis-Rail | Infrastructure & Transit Simulation',
  description: 'Enterprise-grade rail transit simulation, bottleneck prediction, and rerouting control center.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] text-[#F1ECE6] antialiased selection:bg-[#7D4047] selection:text-white">
        {children}
      </body>
    </html>
  );
}