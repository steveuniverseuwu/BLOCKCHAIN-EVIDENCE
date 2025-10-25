import { useMemo, useState, useRef } from 'react';
import SearchInput from './SearchInput.jsx';
import { formatFileSize, formatIsoTimestamp } from '../utils/hashUtils.js';

function shorten(value, chars = 6) {
  if (!value) return '—';
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  if (clean.length <= chars * 2) return value;
  return `${value.slice(0, chars + (value.startsWith('0x') ? 2 : 0))}…${value.slice(-chars)}`;
}

function matchesRecord(record, query) {
  const haystacks = [
    record.fileName,
    record.fileType,
    record.ipfsCid,
    record.digestHex,
    record.merkleRoot,
    record.polygonTxHash,
    record.zkp?.proofId,
  ];
  return haystacks.some((value) => String(value ?? '').toLowerCase().includes(query));
}

function TamperVerification({ evidence, onVerify, isBusy }) {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [activeVerification, setActiveVerification] = useState(null);
  const [pendingRecord, setPendingRecord] = useState(null);
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return evidence;
    return evidence.filter((record) => matchesRecord(record, trimmed));
  }, [evidence, search]);

  const runVerification = async (record, { mode = 'ipfs', file } = {}) => {
    setActiveVerification({ id: record.id, mode });
    setResult(null);
    try {
      const verification = await onVerify(record, file);
      setResult({
        ...verification,
        fileName: verification.fileName ?? record.fileName,
        storageCid: record.ipfsCid,
        source: mode,
      });
    } catch (error) {
      setResult({
        status: 'error',
        message: error.message || 'Unable to verify evidence from IPFS mirror.',
        fileName: record.fileName,
        storageCid: record.ipfsCid,
        source: mode,
      });
    } finally {
      setActiveVerification(null);
    }
  };

  const handleIpfsVerify = (record) => {
    if (isBusy) return;
    runVerification(record, { mode: 'ipfs' });
  };

  const handleTriggerLocal = (record) => {
    if (isBusy) return;
    setPendingRecord(record);
    fileInputRef.current?.click();
  };

  const handleLocalSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !pendingRecord) {
      event.target.value = '';
      return;
    }
    await runVerification(pendingRecord, { mode: 'local', file });
    setPendingRecord(null);
    event.target.value = '';
  };

  return (
    <div className="card verification-pane">
      <div>
        <h2>Automated Tamper Detection</h2>
        <p className="section-subtitle">
          Browse the session&apos;s IPFS mirror, select an evidence artifact, and replay hashing with a single click.
        </p>
      </div>

      <div className="input-group">
        <label htmlFor="verify-search">Search IPFS storage</label>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search filename, CID, hash, Merkle root, or proof ID"
        />
      </div>
      <small className="verification-note">
        Temporary local test button lets you pick a file from disk to simulate tampering; remove before production.
      </small>

      <div className="verification-storage">
        {!filtered.length ? (
          <div className="banner">
            <strong>No matching evidence.</strong> Refine your search or register new batches to populate the IPFS
            mirror.
          </div>
        ) : (
          filtered.map((record) => (
            <div key={record.id} className="verification-row">
              <div className="verification-meta">
                <div className="verification-title">
                  <strong>{record.fileName}</strong>
                  <span>{record.fileType}</span>
                </div>
                <div className="verification-details">
                  <span>Size: {formatFileSize(record.fileSize)}</span>
                  <span>Anchored: {formatIsoTimestamp(record.uploadedAt)}</span>
                  <span>Merkle root: {shorten(record.merkleRoot, 10)}</span>
                  <span>Txn: {shorten(record.polygonTxHash)}</span>
                  <span>Proof: {record.zkp?.proofId ?? '—'}</span>
                </div>
              </div>
              <div className="verification-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => handleIpfsVerify(record)}
                  disabled={
                    isBusy ||
                    (activeVerification &&
                      activeVerification.id === record.id &&
                      activeVerification.mode === 'ipfs')
                  }
                >
                  {activeVerification &&
                  activeVerification.id === record.id &&
                  activeVerification.mode === 'ipfs'
                    ? 'Verifying...'
                    : 'Verify from IPFS mirror'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact btn-outline"
                  onClick={() => handleTriggerLocal(record)}
                  disabled={
                    isBusy ||
                    (activeVerification &&
                      activeVerification.id === record.id &&
                      activeVerification.mode === 'local')
                  }
                >
                  {activeVerification &&
                  activeVerification.id === record.id &&
                  activeVerification.mode === 'local'
                    ? 'Testing...'
                    : 'Temp: Test with local file'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleLocalSelection}
      />

      {result && (
        <div
          className={`banner ${result.status === 'verified' ? 'badge-verified' : result.status === 'tampered' ? 'badge-alert' : ''}`}
          style={{
            background:
              result.status === 'verified'
                ? 'rgba(34,197,94,0.1)'
                : result.status === 'tampered'
                  ? 'rgba(248,113,113,0.12)'
                  : 'rgba(15,23,42,0.65)',
          }}
        >
          <strong>
            {result.status === 'verified'
              ? 'Evidence intact'
              : result.status === 'tampered'
                ? 'Tampering detected'
                : 'Verification failed'}
          </strong>
          <div style={{ marginTop: '0.5rem' }}>
            {result.status === 'error' ? (
              result.message
            ) : (
              <>
                <div>
                  {result.status === 'verified'
                    ? 'SHA-256 digest and Merkle proof match the anchored values.'
                    : 'Computed digest or proof no longer matches the anchored state.'}
                </div>
                <div className="monospace" style={{ marginTop: '0.35rem' }}>
                  expected: {result.expectedDigest?.slice(0, 24)}… · actual: {result.actualDigest?.slice(0, 24)}…
                </div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.82rem' }}>
                 Checked {result.checkedAt ?? '—'} · Anchor tx {result.polygonTxHash}
               </div>
               <div style={{ marginTop: '0.2rem', fontSize: '0.82rem' }}>
                  Verification tx {result.verificationTxHash} · CID {shorten(result.storageCid, 10)}
                </div>
                <div style={{ marginTop: '0.2rem', fontSize: '0.8rem', color: 'rgba(226,232,255,0.65)' }}>
                  Source: {result.source === 'local' ? 'Temporary local file test' : 'Mock IPFS mirror'}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TamperVerification;
