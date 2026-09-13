// Real WebAuthn passkey smart-account demo — creates a genuine browser passkey
// (navigator.credentials.create()), deploys a real, fresh account-abstraction-wallet
// instance keyed to it, and authorizes a real on-chain execute() call using ONLY a real
// WebAuthn assertion (navigator.credentials.get()) — no Freighter/seed-phrase signature
// involved in that last step. This is the one thing this whole ecosystem's real
// WebAuthn/secp256r1 contract-level work (24 passing tests, real secp256r1_verify) has
// never actually been shown doing end-to-end in a browser — see README for why this
// exists and what it proves versus the Freighter-based "Real Gasless Transaction" demo.
//
// Two real cryptographic conversions live here because the browser's WebAuthn API and
// Soroban's secp256r1 host functions use different wire formats for the same P-256 key
// material:
//   1. COSE_Key (CBOR, what attestationObject.authData embeds) -> SEC-1 uncompressed
//      (0x04 || X || Y, 65 bytes, what account-abstraction-wallet's init() expects).
//   2. DER-encoded ECDSA signature (what navigator.credentials.get() returns) -> raw
//      r||s (64 bytes) with s normalized to low-S — Soroban's secp256r1_verify requires
//      low-S and traps on a signature that isn't (see the contract's own doc comment on
//      verify_passkey_signature for why; not every authenticator guarantees this).
import freighter from 'https://esm.sh/@stellar/freighter-api@6.0.1';

// Client/AssembledTransaction live under window.StellarSdk.contract (a separate namespace
// from the base SDK) — matching the exact pattern real.js already uses for the same UMD
// build, see that file's own header comment for why the pre-bundled UMD is loaded instead
// of separate ESM module fetches.
const { Client: ContractClient } = window.StellarSdk.contract;
const { xdr, authorizeEntry } = window.StellarSdk;

const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const RPC_URL = 'https://soroban-testnet.stellar.org';

// The real, currently-deployed account-abstraction-wallet's wasm hash — already installed
// on testnet, so deploying a fresh instance for a new passkey needs no re-upload, just a
// createCustomContract operation against this hash. Confirmed via `stellar contract fetch`
// + sha256sum against the live deployed instance (see README's Deployment section).
const WALLET_WASM_HASH = '1b3915d3f408b32ce693ed2b59187d998d3551141b87dda7ea252239f24ea047';

const P256_ORDER = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551');

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  return out;
}

function bigIntTo32Bytes(n) {
  const hex = n.toString(16).padStart(64, '0');
  return hexToBytes(hex);
}

function bytesToBigInt(bytes) {
  return BigInt('0x' + bufToHex(bytes));
}

/**
 * Minimal CBOR map reader — not a general CBOR library, just enough to walk a COSE_Key
 * EC2 map (5 integer-keyed entries: kty, alg, crv, x, y) the way every conformant
 * platform authenticator actually encodes it. Real parsing of real bytes, scoped
 * deliberately narrow rather than pulling in a full CBOR dependency for one struct shape.
 */
function parseCoseEc2PublicKey(coseBytes) {
  let offset = 0;
  const bytes = new Uint8Array(coseBytes);

  function readTypeInfo() {
    const first = bytes[offset++];
    const majorType = first >> 5;
    let value = first & 0x1f;
    if (value === 24) { value = bytes[offset]; offset += 1; }
    else if (value === 25) { value = (bytes[offset] << 8) | bytes[offset + 1]; offset += 2; }
    return { majorType, value };
  }

  function readValue() {
    const { majorType, value } = readTypeInfo();
    if (majorType === 0) return value; // unsigned int
    if (majorType === 1) return -1 - value; // negative int
    if (majorType === 2) { const b = bytes.slice(offset, offset + value); offset += value; return b; } // byte string
    throw new Error(`Unsupported CBOR major type ${majorType} while parsing COSE key`);
  }

  const mapHeader = readTypeInfo();
  if (mapHeader.majorType !== 5) throw new Error('Expected a CBOR map for COSE public key');
  const entries = {};
  for (let i = 0; i < mapHeader.value; i++) {
    const key = readValue();
    const val = readValue();
    entries[key] = val;
  }

  const kty = entries[1];
  const crv = entries[-1];
  const x = entries[-2];
  const y = entries[-3];
  if (kty !== 2) throw new Error(`Expected COSE kty=2 (EC2), got ${kty} — this passkey isn't a P-256 key`);
  if (crv !== 1) throw new Error(`Expected COSE crv=1 (P-256), got ${crv} — account-abstraction-wallet only supports P-256/secp256r1`);
  if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array) || x.length !== 32 || y.length !== 32) {
    throw new Error('COSE key x/y coordinates are not 32 real bytes each');
  }

  // SEC-1 uncompressed point: 0x04 || X || Y — exactly what secp256r1_verify and
  // account-abstraction-wallet's init()/BytesN<65> expect.
  const sec1 = new Uint8Array(65);
  sec1[0] = 0x04;
  sec1.set(x, 1);
  sec1.set(y, 33);
  return sec1;
}

/**
 * Extracts the COSE_Key bytes from a real attestationObject's authData. authData layout
 * (WebAuthn spec §6.1): 32-byte rpIdHash, 1-byte flags, 4-byte signCount, then — only when
 * the attested-credential-data flag is set (real passkey registration always sets it) —
 * 16-byte AAGUID, 2-byte credentialIdLength (L), L-byte credentialId, then the COSE public
 * key as the remaining bytes.
 */
function extractCoseKeyFromAuthData(authDataBuffer) {
  const authData = new Uint8Array(authDataBuffer);
  const flags = authData[32];
  const attestedCredentialDataPresent = (flags & 0x40) !== 0;
  if (!attestedCredentialDataPresent) {
    throw new Error('authData has no attested credential data — this browser/authenticator did not return a public key on registration');
  }
  const credentialIdLength = (authData[36] << 8) | authData[37];
  const coseKeyStart = 38 + credentialIdLength;
  return authData.slice(coseKeyStart);
}

/** Real DER ECDSA-Sig-Value parsing: SEQUENCE { r INTEGER, s INTEGER }. Returns raw
 * 32-byte-each r||s with s normalized to low-S (Soroban's secp256r1_verify requirement —
 * see this file's header comment). DER integers can carry a leading 0x00 padding byte
 * (when the high bit would otherwise make them look negative) or be shorter than 32 bytes
 * (when the value has leading zero bytes) — both handled by padding/truncating to 32. */
function derSignatureToRawLowS(derBuffer) {
  const der = new Uint8Array(derBuffer);
  let offset = 0;
  if (der[offset++] !== 0x30) throw new Error('Not a DER SEQUENCE — unexpected signature format from this authenticator');
  let seqLen = der[offset++];
  if (seqLen & 0x80) { const n = seqLen & 0x7f; seqLen = 0; for (let i = 0; i < n; i++) seqLen = (seqLen << 8) | der[offset++]; }

  function readInt() {
    if (der[offset++] !== 0x02) throw new Error('Expected DER INTEGER inside signature SEQUENCE');
    let len = der[offset++];
    let bytes = der.slice(offset, offset + len);
    offset += len;
    while (bytes.length > 32 && bytes[0] === 0x00) bytes = bytes.slice(1);
    if (bytes.length < 32) { const padded = new Uint8Array(32); padded.set(bytes, 32 - bytes.length); bytes = padded; }
    return bytes;
  }

  const rBytes = readInt();
  let sBytes = readInt();
  let s = bytesToBigInt(sBytes);
  if (s > P256_ORDER / 2n) {
    s = P256_ORDER - s;
    sBytes = bigIntTo32Bytes(s);
  }

  const raw = new Uint8Array(64);
  raw.set(rBytes, 0);
  raw.set(sBytes, 32);
  return raw;
}

/** Real navigator.credentials.create() call — a genuine browser WebAuthn registration
 * ceremony (TouchID/FaceID/Windows Hello/security key, whatever the platform offers), not
 * a simulated one. Returns the real SEC-1 public key extracted from the real attestation,
 * plus the real credential ID needed to reference this passkey again later. */
export async function createRealPasskey(displayName) {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported in this browser.');
  }
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Stellar Gasless Network (demo)' },
      user: { id: userId, name: displayName, displayName },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256 = ECDSA w/ P-256 — the only algorithm account-abstraction-wallet supports
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
      timeout: 60000,
      attestation: 'none',
    },
  });

  const attestationResponse = credential.response;
  const authDataBuffer = attestationResponse.getAuthenticatorData
    ? attestationResponse.getAuthenticatorData()
    : (() => { throw new Error('This browser does not expose getAuthenticatorData() on the attestation response.'); })();

  const coseKeyBytes = extractCoseKeyFromAuthData(authDataBuffer);
  const sec1PublicKey = parseCoseEc2PublicKey(coseKeyBytes);

  return {
    credentialId: credential.rawId,
    credentialIdBase64: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
    sec1PublicKeyHex: bufToHex(sec1PublicKey),
  };
}

/** Real navigator.credentials.get() call, signing whatever 32-byte challenge is passed in
 * (for account-abstraction-wallet's __check_auth, that's the host's own real
 * signature_payload digest for the transaction being authorized — see soroban.ts). Returns
 * the raw pieces __check_auth's WalletSignature::Owner(PasskeySignature) needs, with the
 * DER signature already converted to the raw low-S form the contract requires. */
export async function signRealPasskeyChallenge(credentialIdBuffer, challenge32Bytes) {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: challenge32Bytes,
      allowCredentials: [{ id: credentialIdBuffer, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    },
  });

  const response = assertion.response;
  return {
    clientDataJSON: new Uint8Array(response.clientDataJSON),
    authenticatorData: new Uint8Array(response.authenticatorData),
    signature: derSignatureToRawLowS(response.signature),
  };
}

/** Deploys a REAL, fresh `account-abstraction-wallet` instance from the already-installed
 * wasm hash (no re-upload needed — createCustomContract against an existing hash, exactly
 * what `stellar contract deploy` does under the hood), then calls its real `init()` with
 * the real passkey's SEC-1 public key. `ownerAddress`/`signTransaction` pay for and sign
 * both real transactions (Freighter, in this demo) — `owner` retains admin authority
 * (add_session_key, recovery), while the passkey alone controls `execute()` from here on. */
export async function deployRealPasskeyWallet(ownerAddress, signTransaction, sec1PublicKeyHex) {
  const deployTx = await ContractClient.deploy(null, {
    wasmHash: WALLET_WASM_HASH,
    format: 'hex',
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey: ownerAddress,
    signTransaction,
  });
  const deployedSent = await deployTx.signAndSend();
  const deployedClient = deployedSent.result;
  const walletContractId = deployedClient.options.contractId;

  const initTx = await deployedClient.init(
    { owner: ownerAddress, passkey_pubkey: Buffer.from(hexToBytes(sec1PublicKeyHex)) },
    { timeoutInSeconds: 1800 }
  );
  await initTx.signAndSend();

  return walletContractId;
}

/** The one real action this demo proves end-to-end: a real `execute()` call on a real
 * deployed wallet, authorized ENTIRELY by a real WebAuthn assertion — no Freighter
 * signature anywhere in the authorization itself (Freighter here only pays the network fee
 * as the transaction's source account, a separate concern from who *authorized* the call —
 * see the multi-auth note in soroban.ts). Target defaults to the wallet calling its own
 * real `get_owner()`, since that needs no funding/setup to be a genuine on-chain action
 * gated by `__check_auth` — any real target+function works the same way, this one is just
 * the simplest to demonstrate safely. */
export async function executeRealViaPasskey({
  walletContractId,
  feePayerAddress,
  feePayerSignTransaction,
  credentialIdBuffer,
  targetContractId = walletContractId,
  targetFunction = 'get_owner',
  targetArgs = [],
}) {
  const walletClient = await ContractClient.from({
    contractId: walletContractId,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey: feePayerAddress,
    signTransaction: feePayerSignTransaction,
  });

  const tx = await walletClient.execute(
    { target: targetContractId, function: targetFunction, args: targetArgs },
    { timeoutInSeconds: 1800 }
  );

  const needsSigning = tx.needsNonInvokerSigningBy();
  if (!needsSigning.includes(walletContractId)) {
    throw new Error(
      `Expected the wallet contract (${walletContractId}) to need its own auth entry, but needsNonInvokerSigningBy() returned: ${JSON.stringify(needsSigning)}`
    );
  }

  await tx.signAuthEntries({
    address: walletContractId,
    authorizeEntry: async (entry, _signer, validUntilLedgerSeq, networkPassphrase) => {
      const passkeySigner = async (_preimage, payload) => {
        // `payload` here IS the real signature_payload __check_auth receives — the exact
        // 32-byte digest a real WebAuthn assertion's `challenge` must sign for this to
        // verify on-chain. No reconstruction needed on our side beyond passing it straight
        // through to a real navigator.credentials.get() call.
        const assertion = await signRealPasskeyChallenge(credentialIdBuffer, payload);

        // Uses the WALLET'S OWN real on-chain spec (fetched into walletClient.spec when we
        // built the client above) to encode the WalletSignature enum exactly the way the
        // deployed contract actually expects it — not a guessed/hand-rolled ScVal shape.
        const walletSignatureScVal = walletClient.spec.nativeToScVal(
          {
            tag: 'Owner',
            values: [
              {
                client_data_json: Buffer.from(assertion.clientDataJSON),
                authenticator_data: Buffer.from(assertion.authenticatorData),
                signature: Buffer.from(assertion.signature),
              },
            ],
          },
          xdr.ScSpecTypeDef.scSpecTypeUdt(new xdr.ScSpecTypeUdt({ name: 'WalletSignature' }))
        );

        return { signatureScVal: walletSignatureScVal, address: walletContractId };
      };

      return authorizeEntry(entry, passkeySigner, validUntilLedgerSeq, networkPassphrase, walletContractId);
    },
  });

  const sent = await tx.signAndSend();
  return { result: sent.result, txHash: sent.sendTransactionResponse?.hash ?? sent.getTransactionResponse?.txHash ?? '' };
}

export { WALLET_WASM_HASH, NETWORK_PASSPHRASE, RPC_URL, bufToHex, hexToBytes };

// --- Passkey Wallet tab wiring -----------------------------------------------------------

let funderAddress = null;
let createdCredentialId = null;
let createdSec1PublicKeyHex = null;
let deployedWalletId = null;

document.addEventListener('DOMContentLoaded', () => {
  const tab = document.getElementById('passkeyWalletTab');
  if (!tab) return;

  const connectBtn = document.getElementById('passkeyFunderConnectBtn');
  const funderStatus = document.getElementById('passkeyFunderStatus');
  const createBtn = document.getElementById('passkeyCreateBtn');
  const createStatus = document.getElementById('passkeyCreateStatus');
  const deployBtn = document.getElementById('passkeyDeployBtn');
  const deployStatus = document.getElementById('passkeyDeployStatus');
  const executeBtn = document.getElementById('passkeyExecuteBtn');
  const executeStatus = document.getElementById('passkeyExecuteStatus');

  const refreshButtons = () => {
    createBtn.disabled = !funderAddress;
    deployBtn.disabled = !funderAddress || !createdCredentialId;
    executeBtn.disabled = !deployedWalletId;
  };

  connectBtn.addEventListener('click', async () => {
    funderStatus.textContent = 'Connecting...';
    try {
      const { isConnected, error: connErr } = await freighter.isConnected();
      if (connErr || !isConnected) throw new Error('Freighter not detected — install it from freighter.app.');
      const { address, error } = await freighter.requestAccess();
      if (error || !address) throw new Error(error?.message || 'Wallet access denied.');
      funderAddress = address;
      funderStatus.innerHTML = `<span style="color: var(--accent-green);">Connected: ${address}</span> — will pay the real network fees for deploying your wallet and initializing it. It never controls your passkey wallet's actual authority.`;
    } catch (err) {
      funderStatus.innerHTML = `<span style="color:#f87171;">${err.message}</span>`;
    }
    refreshButtons();
  });

  createBtn.addEventListener('click', async () => {
    createStatus.textContent = 'Requesting a real passkey from your browser — watch for a biometric/security-key prompt...';
    try {
      const { credentialId, sec1PublicKeyHex } = await createRealPasskey('Stellar Gasless demo wallet');
      createdCredentialId = credentialId;
      createdSec1PublicKeyHex = sec1PublicKeyHex;
      createStatus.innerHTML = `<span style="color: var(--accent-green);">Real passkey created.</span> Public key (SEC-1, 65 bytes): <code style="word-break:break-all;">${sec1PublicKeyHex}</code>`;
    } catch (err) {
      createStatus.innerHTML = `<span style="color:#f87171;">${err.message}</span>`;
    }
    refreshButtons();
  });

  deployBtn.addEventListener('click', async () => {
    deployStatus.textContent = 'Deploying your wallet contract on testnet, then initializing it with your real passkey...';
    try {
      const walletId = await deployRealPasskeyWallet(funderAddress, freighter.signTransaction, createdSec1PublicKeyHex);
      deployedWalletId = walletId;
      deployStatus.innerHTML = `<span style="color: var(--accent-green);">Deployed and initialized.</span> Wallet contract: <code>${walletId}</code> — <a href="https://stellar.expert/explorer/testnet/contract/${walletId}" target="_blank" rel="noopener noreferrer" style="color:#818cf8;">view on stellar.expert</a>`;
    } catch (err) {
      deployStatus.innerHTML = `<span style="color:#f87171;">${err.message}</span>`;
    }
    refreshButtons();
  });

  executeBtn.addEventListener('click', async () => {
    executeStatus.textContent = 'Building a real on-chain call, then asking your passkey to authorize it — watch for a biometric/security-key prompt (NOT Freighter)...';
    try {
      const { txHash, result } = await executeRealViaPasskey({
        walletContractId: deployedWalletId,
        feePayerAddress: funderAddress,
        feePayerSignTransaction: freighter.signTransaction,
        credentialIdBuffer: createdCredentialId,
      });
      executeStatus.innerHTML = `<span style="color: var(--accent-green);">Authorized entirely by your passkey — no Freighter signature involved in the authorization.</span> Wallet owner: <code>${result}</code> — <a href="https://stellar.expert/explorer/testnet/tx/${txHash}" target="_blank" rel="noopener noreferrer" style="color:#818cf8;">view real tx</a>`;
    } catch (err) {
      executeStatus.innerHTML = `<span style="color:#f87171;">${err.message}</span>`;
    }
  });

  refreshButtons();
});

