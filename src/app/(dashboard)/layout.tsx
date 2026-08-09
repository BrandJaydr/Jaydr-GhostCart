import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div>
      <nav aria-label="Main navigation">
        <p style={{ color: 'gray' }}>[Navigation placeholder — Stage 1 scaffold]</p>
      </nav>
      <main>{children}</main>
    </div>
  );
}
