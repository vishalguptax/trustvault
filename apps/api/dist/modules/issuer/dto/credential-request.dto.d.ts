export declare class CredentialProofDto {
    proof_type: string;
    jwt: string;
}
export declare class CredentialDefinitionDto {
    type: string[];
}
export declare class CredentialRequestDto {
    format: string;
    credential_definition: CredentialDefinitionDto;
    proof?: CredentialProofDto;
}
//# sourceMappingURL=credential-request.dto.d.ts.map