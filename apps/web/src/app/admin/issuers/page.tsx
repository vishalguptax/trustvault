export default function TrustedIssuersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Trusted Issuers</h2>
        <button className="bg-primary text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          Register New Issuer
        </button>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground text-sm">
          Connect to the backend API to view and manage trusted issuers.
        </p>
      </div>
    </div>
  );
}
