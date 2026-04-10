# TrustiLock Glossary — Every Term Explained Simply

> This document explains every technical term, protocol, and concept used in TrustiLock.
> No prior knowledge assumed. Read this before the presentation.

---

## The Core Idea

Think of how the physical world works:

- A **university** prints your **degree certificate** on official paper with a stamp
- You **keep it** in a folder at home
- When a **bank** needs to see it for a loan, you show them a photocopy
- The bank **calls the university** to confirm it is real

TrustiLock does the same thing, but digitally:

- A **university** creates a **digital credential** signed with cryptography
- You **store it** on your phone in a wallet app
- When a **bank** needs to see it, you share it from your phone
- The bank **checks the cryptographic signature** instantly (no phone call needed)

That is the entire project. Everything below is the details of HOW.

---

## Part 1: The People Involved

### Issuer

**What:** The organization that creates and gives out credentials.

**Real-world examples:**
- A university issuing a degree certificate
- An employer issuing a salary slip
- A government issuing an Aadhaar card

**In TrustiLock:** The issuer logs into the web portal, fills in the student's details, and creates a QR code. The student scans it to receive the credential.

---

### Holder

**What:** The person who receives and owns credentials. That is you.

**Real-world analogy:** You keep your marksheets, ID cards, and salary slips in a folder. In TrustiLock, your phone IS that folder — it is called a "wallet."

**In TrustiLock:** The holder uses the mobile app. They scan QR codes to receive credentials, and they choose what to share when someone asks for verification.

---

### Verifier

**What:** The organization that needs to check your credentials.

**Real-world examples:**
- A bank checking your degree and income for a loan
- An employer checking your previous employment
- A landlord checking your identity

**In TrustiLock:** The verifier logs into the web portal, creates a verification request ("I need to see your degree and income proof"), and generates a QR code. The holder scans it and shares the credentials.

---

## Part 2: Verifiable Credentials — The Digital Documents

### What is a Credential?

A credential is any document that proves a fact about you. In the physical world:

```
Your marksheet proves    → you graduated with a certain GPA
Your salary slip proves  → you earn a certain amount
Your Aadhaar proves      → your name, address, and date of birth
```

### What makes it "Verifiable"?

In the physical world, you verify a document by calling the issuer ("Did you really issue this to Sandhya Sharma?"). This is slow, expensive, and sometimes impossible.

A **Verifiable Credential** is different. It is signed using math (cryptography). Anyone can instantly check:

1. **Who signed it** — which organization issued this credential
2. **Was it changed** — did someone tamper with the data after it was signed
3. **Is it still valid** — has the issuer revoked it

No phone calls. No waiting. The math is the proof.

### What does a Verifiable Credential look like?

It is just data (JSON) with a signature attached:

```
┌──────────────────────────────────────────────────┐
│ HEADER: "I am an SD-JWT-VC signed with ES256"    │
├──────────────────────────────────────────────────┤
│ PAYLOAD (the actual information):                │
│   Issuer: National Technical University          │
│   Subject: Sandhya Sharma                        │
│   Type: Education Credential                     │
│   Degree: B.Tech                                 │
│   Field: Computer Science                        │
│   GPA: 3.8  (can be hidden)                      │
│   Graduation: 2024-06-15  (can be hidden)        │
│   Issued: 2024-07-01                             │
│   Expires: 2025-07-01                            │
├──────────────────────────────────────────────────┤
│ SIGNATURE: eyJhbGciOiJFUzI1NiJ9...              │
│   (mathematical proof that NTU signed this)      │
└──────────────────────────────────────────────────┘
```

If someone changes even one letter (like changing GPA from 3.8 to 4.0), the signature breaks and verification fails. It is mathematically impossible to forge.

---

## Part 3: Selective Disclosure — Share Only What You Want

### The Privacy Problem

When you show your marksheet to a bank for a loan, the bank sees EVERYTHING — your name, roll number, every subject, every mark, your father's name, your address. But they only needed to know: "Did this person graduate?"

### How Selective Disclosure Solves It

With SD-JWT (Selective Disclosure JSON Web Token), the credential splits information into two types:

**Fixed claims** — always visible, cannot be hidden:
- Issuer name (who signed it)
- Credential type (what kind of credential)
- Your name (who it is about)

**Selectable claims** — YOU choose whether to show or hide:
- GPA
- Date of birth
- Salary amount
- Student ID
- Address

### Example: Applying for a Loan

The bank says: "Show me your education credential."

You open your wallet app and see:

```
┌────────────────────────────────────────┐
│  Education Credential                  │
│  from National Technical University    │
│                                        │
│  Always shown:                         │
│    Name: Sandhya Sharma                │
│    Degree: B.Tech                      │
│    Institution: NTU                    │
│                                        │
│  You choose:                           │
│    [✓] Field of Study                  │  ← you allow this
│    [ ] GPA                             │  ← you hide this
│    [ ] Graduation Date                 │  ← you hide this
│    [ ] Student ID                      │  ← you hide this
│                                        │
│  [ SHARE ]                             │
└────────────────────────────────────────┘
```

The bank receives: "Sandhya Sharma has a B.Tech in Computer Science from NTU." They do NOT see your GPA, graduation date, or student ID. And the signature STILL works — the bank can verify this is genuine even with hidden fields.

### How Does This Work Technically?

1. When NTU signs the credential, each selectable claim is turned into a **hash** (a fingerprint)
2. The signed credential contains: fixed claims + hashes of selectable claims + signature
3. The actual values of selectable claims are stored separately as **disclosures**
4. When you share the credential, you include ONLY the disclosures you want to reveal
5. The verifier checks: "The hash of the revealed value matches the hash in the signed credential — so this is genuine"

The key insight: **the signature covers the hashes, not the values**. So hiding a value does not break the signature.

---

## Part 4: DID — Your Digital Identity

### The Problem with Current Identities

Every identity you have is controlled by someone else:

```
sandhya@gmail.com       → Google controls this
Aadhaar: XXXX-XXXX-4829 → Government controls this
Student ID: NTU-2020-CS  → University controls this
```

If Google deletes your account, your email identity is gone. If the university shuts down, your student ID means nothing.

### What is a DID?

A DID (Decentralized Identifier) is an identity that **you own through a cryptographic key**. No company, no government, no server controls it.

```
did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
```

This looks complicated, but it is just your public key encoded as a string. The matching private key is stored securely on your phone.

**Key property:** If you have the private key, you ARE this identity. No one can take it away. No one can pretend to be you (because they do not have your private key).

### did:key — The Simplest DID Method

TrustiLock uses `did:key` because:
- **No blockchain needed** — the DID is self-contained
- **No server needed** — the public key IS the identifier
- **No cost** — generating a DID is just generating a key pair
- **Instant** — no registration, no approval, no waiting

How it works:
1. Generate a key pair (private key + public key)
2. Encode the public key as a string → that IS your DID
3. Anyone who sees your DID can extract your public key from it
4. They use your public key to verify your signatures

---

## Part 5: The Protocols — How the Pieces Talk to Each Other

### What is a Protocol?

A protocol is a set of rules for communication. Just like:
- **HTTP** is the protocol for loading websites
- **SMTP** is the protocol for sending emails

TrustiLock uses two protocols:
- **OID4VCI** — for issuing credentials
- **OID4VP** — for verifying credentials

### OID4VCI — How You Receive a Credential

**Full name:** OpenID for Verifiable Credential Issuance

**In simple words:** This is the step-by-step dance between an issuer and your wallet when the issuer gives you a credential.

**Everyday analogy:** Think of ordering a parcel online:

```
Online Shopping                     OID4VCI
──────────────                      ───────
You order a product           →     Issuer creates a credential offer
You get a tracking code       →     Wallet gets a pre-authorized code
You show the code at pickup   →     Wallet exchanges code for an access token
You collect the parcel        →     Wallet downloads the signed credential
```

**Step by step in TrustiLock:**

```
Step 1: Issuer creates an offer
   The issuer portal shows a QR code on screen.
   The QR code contains: "Come to this URL with this one-time code
   to pick up an education credential."

Step 2: You scan the QR code
   Your wallet app reads the QR code and extracts:
   - Where to go (the issuer's URL)
   - What to ask for (education credential)
   - The pickup code (pre-authorized code)

Step 3: Your wallet exchanges the code for permission
   Wallet sends the pickup code to the issuer.
   Issuer checks: "Yes, this code is valid and not expired."
   Issuer responds with: an access token (temporary permission)
   and a challenge number (c_nonce — to prevent replay attacks).

Step 4: Your wallet requests the actual credential
   Wallet sends: the access token + proof that it holds your private key.
   Issuer checks the proof, signs the credential with its own private key,
   and sends back the signed SD-JWT-VC.

Step 5: Your wallet stores the credential
   The credential is saved securely on your phone.
   You can now see it in your wallet dashboard.
```

**Why all these steps?** Security. Each step prevents a different attack:
- The one-time code prevents unauthorized access
- The access token expires quickly (5 minutes)
- The c_nonce prevents someone from replaying your request
- The holder proof ensures only YOUR wallet gets YOUR credential

---

### OID4VP — How You Prove Something to a Verifier

**Full name:** OpenID for Verifiable Presentations

**In simple words:** This is the step-by-step dance when a verifier asks you to prove something and you show them your credentials.

**Everyday analogy:** Think of going through airport security:

```
Airport Security                    OID4VP
────────────────                    ──────
Security says "show passport"  →    Verifier creates a request
You open your bag              →    Wallet shows your credentials
You hand over the passport     →    You select what to share
Security checks the photo      →    Verifier checks the signature
Security says "go through"     →    Verifier says "verified"
```

**Step by step in TrustiLock:**

```
Step 1: Verifier creates a request
   The verifier portal shows a QR code on screen.
   The QR code says: "I am HomeFirst Finance. I need to see your
   education and income credentials. Here is a unique request ID."

Step 2: You scan the QR code
   Your wallet reads the QR and shows you:
   "HomeFirst Finance wants to see:
    - Your Education Credential
    - Your Income Credential
    Purpose: Loan application"

Step 3: You choose what to share (selective disclosure)
   Your wallet shows each credential with toggles:
   "Education: show degree? [yes]  show GPA? [no]  show studentId? [no]"
   "Income: show employer? [yes]  show salary? [yes]  show employeeId? [no]"

Step 4: You give consent
   You tap "Allow" — this is recorded as a consent record.
   Your wallet creates a "presentation" — the credentials with only
   the selected claims revealed.

Step 5: The presentation is sent to the verifier
   Your wallet sends the presentation directly to the verifier's API.

Step 6: The verifier runs its validation pipeline
   Four checks happen automatically:

   Check 1 — Signature: "Is this credential really signed by NTU?"
             → Looks up NTU's public key, verifies the signature. PASS.

   Check 2 — Trust: "Is NTU in our trust registry?"
             → Looks up the trust registry. NTU is listed. PASS.

   Check 3 — Status: "Has this credential been revoked?"
             → Checks the bitstring status list. Bit is 0 (active). PASS.

   Check 4 — Expiration: "Is this credential still valid?"
             → Checks the expiry date. Not expired. PASS.

   All four pass → VERIFIED.

Step 7: The verifier sees the result
   The verifier portal shows: "Verified ✓" with all the details.
   The loan application can proceed.
```

---

## Part 6: Trust Registry — Who Should We Believe?

### The Problem

Anyone can create a DID and sign a credential. I could create a DID called `did:key:zFakeUniversity` and sign a credential saying "Sandhya has a PhD from MIT." The signature would be mathematically valid. But it would be a lie.

### The Solution: A Trust Registry

A trust registry is simply a **list of approved issuers**. It says:

```
"We trust these organizations to issue these credential types:"

  National Technical University  → Education Credentials     ✓ ACTIVE
  Apex Financial Services        → Income Credentials        ✓ ACTIVE
  National Identity Authority    → Identity Credentials      ✓ ACTIVE
  QuickDegree Online             → Education Credentials     ✗ SUSPENDED
```

When a verifier receives a credential, it checks:
1. Is the issuer in the trust registry?
2. Is the issuer approved for THIS type of credential?
3. Is the issuer's status active (not suspended)?

If any check fails, the credential is rejected — even if the signature is valid.

### Who Manages the Trust Registry?

In TrustiLock, the **admin** manages it through the Trust Admin web portal. In the real world, this would be a government agency, an industry body, or a consortium of organizations.

---

## Part 7: Revocation — Cancelling a Credential

### Why Revocation is Needed

Credentials are valid for a long time (often years). But things change:
- A student is expelled → their degree credential should be cancelled
- An employee is fired → their employment credential should be cancelled
- Fraud is discovered → the credential should be cancelled immediately

### How Bitstring Status List Works

Every issuer maintains a **status list** — a long string of bits (0s and 1s). Each credential gets assigned one position (index) in this list.

```
Position:  0  1  2  3  4  5  6  7  ...  131071
Value:     0  0  1  0  0  0  0  0  ...  0
           ↑  ↑  ↑
           │  │  └── Credential #2 is REVOKED (bit = 1)
           │  └──── Credential #1 is ACTIVE (bit = 0)
           └────── Credential #0 is ACTIVE (bit = 0)
```

**When the issuer revokes credential #2:**
They flip bit 2 from 0 to 1. That is it.

**When a verifier checks credential #2:**
They download the status list, look at bit 2, see it is 1 → REVOKED → reject the credential.

### Why Not Just Delete the Credential?

Because the holder has a copy on their phone. You cannot delete something from someone's phone. Instead, you mark it as revoked in the status list, and any verifier who checks will see it is no longer valid.

### Privacy Trick

The verifier downloads the ENTIRE status list (all 131,072 bits) and checks locally. This means the issuer never knows WHICH credential the verifier is checking. If the verifier only asked about one specific credential, the issuer could track who is verifying whom.

---

## Part 8: Cryptography — The Math That Makes It All Work

### Digital Signatures in Simple Terms

Imagine you have a special pen that:
1. Only you can write with it (private key)
2. Anyone can check if writing was done by your pen (public key)
3. If someone erases or changes even one letter, the ink turns red (tamper detection)

That is what a digital signature does.

### How ES256 Works (High Level)

ES256 is the specific algorithm TrustiLock uses. You do not need to understand the math, but here is the flow:

```
SIGNING (done by the issuer):
  credential data + issuer's private key → signature (64 bytes)

VERIFYING (done by the verifier):
  credential data + signature + issuer's public key → TRUE or FALSE
```

If the credential data was changed after signing, verification returns FALSE. If a different private key was used (someone pretending to be the issuer), verification returns FALSE. Only the exact original data + the correct private key produces a valid signature.

### Why ES256 Specifically?

- **ES** = Elliptic Curve Digital Signature Algorithm (a type of math)
- **256** = uses the P-256 curve (256-bit security)
- Required by HAIP (the EU standard for digital identity)
- Supported by every phone, browser, and hardware chip
- Compact: 64-byte signatures (RSA signatures are 256 bytes)
- Fast: signing and verification take milliseconds

### Hashing — Digital Fingerprints

A hash function takes any input and produces a fixed-size output (fingerprint):

```
Input: "Sandhya Sharma"      → Hash: a3f2b8c9...
Input: "Sandhya  Sharma"     → Hash: 7e1d4f2a...  (completely different!)
Input: (100-page document)   → Hash: 9b8c7d6e...  (same size output)
```

Properties:
- Same input always gives the same hash
- Even a tiny change gives a completely different hash
- You cannot reverse a hash to get the original input
- Used in SD-JWT to hide claims while keeping them verifiable

---

## Part 9: JWT — The Container Format

### What is a JWT?

JWT (JSON Web Token) is like an envelope that carries data with a signature.

```
eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJkaWQ6a2V5Ono2TWt0.SflKxwRJSMeKKF2QT4fwpM
└──────── Part 1 ──────┘└────────── Part 2 ──────────────┘└──────── Part 3 ──────┘
      HEADER                      PAYLOAD                      SIGNATURE
   "I use ES256"            "The actual data"             "Proof it is real"
```

Each part is Base64-encoded (a way to represent binary data as text). They are separated by dots.

- **Header**: Metadata — which algorithm was used
- **Payload**: The actual claims/data
- **Signature**: Mathematical proof that the header + payload were signed by a specific key

### What is SD-JWT?

SD-JWT is a JWT with an extra feature: some claims in the payload are replaced with hashes. The actual values are attached separately as "disclosures."

```
Regular JWT payload:
  { name: "Sandhya", gpa: 3.8, degree: "B.Tech" }

SD-JWT payload:
  { name: "Sandhya", _sd: ["hash_of_gpa", "hash_of_degree"] }
  ~disclosure1~   ← contains the actual GPA value
  ~disclosure2~   ← contains the actual degree value
```

When presenting, the holder can include disclosure1 but omit disclosure2. The verifier sees the name and GPA but not the degree. The signature still works because it covers the hashes, and the hash of the revealed GPA matches.

### What is SD-JWT-VC?

SD-JWT-VC is SD-JWT specifically designed for Verifiable Credentials. It adds standard fields:

- `iss` — the issuer's DID
- `sub` — the holder's DID
- `vct` — the credential type (like "VerifiableEducationCredential")
- `iat` — when it was issued
- `exp` — when it expires
- `cnf` — the holder's public key (for key binding)

---

## Part 10: The W3C and OpenID Standards

### Who Makes These Standards?

| Organization | What They Do | Standards in TrustiLock |
|-------------|-------------|----------------------|
| **W3C** (World Wide Web Consortium) | Creates web standards (like HTML, CSS) | VC Data Model, DID Core, Bitstring Status List |
| **OpenID Foundation** | Creates identity standards | OID4VCI, OID4VP, HAIP |
| **IETF** (Internet Engineering Task Force) | Creates internet standards | SD-JWT, JWT, JWK |

### Why Standards Matter

Without standards, every organization would invent its own credential format, its own issuance protocol, and its own verification method. Nothing would work together.

With standards:
- A credential issued by NTU in India can be verified by a bank in Germany
- Any wallet app can receive credentials from any issuer
- Any verifier can check credentials from any wallet

This is like how any email app (Gmail, Outlook, Yahoo) can send emails to any other — because they all follow the SMTP standard.

### HAIP — High Assurance Interoperability Profile

HAIP is a set of strict rules from the OpenID Foundation that says: "If you want your system to be considered high-security and interoperable, you MUST use these specific algorithms and protocols."

TrustiLock follows HAIP by using:
- ES256 (P-256) for all signatures
- SD-JWT-VC as the credential format
- OID4VCI for issuance
- OID4VP for verification

---

## Abbreviations Quick Reference

| Short Form | Full Name | One-Line Explanation |
|-----------|-----------|---------------------|
| VC | Verifiable Credential | A digitally signed document that proves something about you |
| VP | Verifiable Presentation | The act of showing your credentials to a verifier |
| DID | Decentralized Identifier | A unique ID that you own through a cryptographic key |
| JWT | JSON Web Token | A signed data packet with three parts: header.payload.signature |
| SD-JWT | Selective Disclosure JWT | A JWT where some claims can be hidden by the holder |
| SD-JWT-VC | SD-JWT Verifiable Credential | SD-JWT designed specifically for credentials |
| OID4VCI | OpenID for VC Issuance | The protocol for receiving credentials from an issuer |
| OID4VP | OpenID for VP | The protocol for presenting credentials to a verifier |
| HAIP | High Assurance Interoperability Profile | Strict rules for security and interoperability |
| ES256 | Elliptic Curve Digital Signature (P-256) | The math algorithm used for all signatures |
| RBAC | Role-Based Access Control | Permissions based on your role (admin, issuer, verifier, holder) |
| CORS | Cross-Origin Resource Sharing | Rules that allow the web app to talk to the API |
| ODM | Object Document Mapper | Mongoose — translates between code and MongoDB |
| DTO | Data Transfer Object | A shape definition that validates incoming API requests |
| E2E | End-to-End | Testing the complete flow from start to finish |
| API | Application Programming Interface | How programs talk to each other over HTTP |
| QR | Quick Response | A square barcode scanned by a phone camera |
| W3C | World Wide Web Consortium | The organization that creates web standards |
| IETF | Internet Engineering Task Force | The organization that creates internet standards |
| NestJS | NestJS | Backend framework for building the API |
| MongoDB | MongoDB | Database that stores data as JSON documents |
| Mongoose | Mongoose | Library that connects NestJS to MongoDB |
