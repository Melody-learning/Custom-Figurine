import { auth } from '@/auth';
import { HeaderClient } from './layout/HeaderClient';

export async function Header() {
  const session = await auth();

  // Extract necessary serializable user details
  const userProps = session?.user ? {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    hasWelcomeCoupon: (session.user as any).hasWelcomeCoupon
  } : null;

  return <HeaderClient user={userProps} />;
}
