export default function IssuerSchemasPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Credential Schemas</h2>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground text-sm">
          View available credential schemas (Education, Income, Identity).
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Schema details will be fetched from the API in FM3.
        </p>
      </div>
    </div>
  );
}
