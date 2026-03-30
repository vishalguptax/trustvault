export default function NewOfferPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Create Credential Offer</h2>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground text-sm">
          Select a schema, fill claim values, and generate a QR code for the wallet holder to scan.
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Full offer creation flow will be implemented in FM3.
        </p>
      </div>
    </div>
  );
}
