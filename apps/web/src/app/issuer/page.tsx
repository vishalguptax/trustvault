export default function IssuerDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Issuer Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Issued" value="--" />
        <StatCard label="Active" value="--" />
        <StatCard label="Revoked" value="--" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Issuances</h3>
        <p className="text-muted-foreground text-sm">
          Connect to the backend API to view issuance activity.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-muted-foreground text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
