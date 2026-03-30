export default function VerifierDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Verifier Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Verifications" value="--" />
        <StatCard label="Verified" value="--" />
        <StatCard label="Rejected" value="--" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Results</h3>
        <p className="text-muted-foreground text-sm">
          Connect to the backend API to view verification results.
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
