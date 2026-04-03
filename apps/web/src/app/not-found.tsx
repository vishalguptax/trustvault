import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <p className="text-lg text-muted-foreground mb-6">Page not found</p>
      <Link
        href="/"
        className="text-sm font-medium text-primary hover:underline"
      >
        Back to Home
      </Link>
    </div>
  );
}
