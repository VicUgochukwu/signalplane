import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, User } from 'lucide-react';

export function AuthNavLink() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-9 w-20 bg-muted rounded animate-pulse" />
    );
  }

  if (user) {
    return (
      <Link
        to="/my-pages"
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted rounded-md transition-colors"
      >
        <User className="h-4 w-4" />
        My Pages
      </Link>
    );
  }

  return (
    <Link
      to="/login"
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted rounded-md transition-colors"
    >
      <LogIn className="h-4 w-4" />
      Sign In
    </Link>
  );
}
