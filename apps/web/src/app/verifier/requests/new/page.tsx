export default function NewVerificationRequestPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Create Verification Request</h2>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground text-sm">
          Select credential types, required claims, and policies. Generate a QR code for the wallet holder to scan.
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Full request creation flow will be implemented in FM3.
        </p>
      </div>
    </div>
  );
}
