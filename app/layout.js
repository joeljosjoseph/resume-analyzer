import "./globals.css";

export const metadata = {
  title: "Grounded Resume Analyzer",
  description: "Upload a resume, paste a job description, and get grounded feedback.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
