import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drawing Board - Display',
  description: 'OBS Browser Source Display',
};

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        html, body {
          background-color: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
      {children}
    </>
  );
}
