import PacmanGame from '@/components/arcade/PacmanGame';

export const metadata = {
  title: 'Arcade — Pac-Man | GhostCart',
};

export default function PacmanArcadePage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#020403', padding: '24px 0' }}>
      <PacmanGame />
    </main>
  );
}
