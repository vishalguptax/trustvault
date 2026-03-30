export default function PoliciesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Verification Policies</h2>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground text-sm">
          Manage verification policies (require-trusted-issuer, require-active-status, require-non-expired).
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Policy management will be implemented in FM3.
        </p>
      </div>
    </div>
  );
}
