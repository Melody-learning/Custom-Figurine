import { auth } from '@/auth';
import { HeaderClient } from './layout/HeaderClient';

export async function Header() {
  const session = await auth();

  return <HeaderClient user={session?.user || null} />;
}
