import { toast } from 'sonner';

/**
 * Wrapper around fetch for Admin pages.
 * Intercepts 401/403 responses → shows toast → redirects to homepage.
 */
export async function adminFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch(url, options);

  if (res.status === 401 || res.status === 403) {
    let errorMsg = 'Access denied. Redirecting...';
    try {
      const data = await res.clone().json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore parse errors
    }
    toast.error(errorMsg);
    // Small delay so the toast is visible before redirect
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
    throw new Error('Unauthorized');
  }

  return res;
}
