import { useState } from 'react';

function TamperVerification({ evidence, onVerify, isBusy }) {
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);

  const handleSelect = (event) => {
    setSelectedId(event.target.value);
    setResult(null);
  };

  const handleFile = async (event) => {
    if (!event.target.files?.length || !selectedId) return;
    const file = event.target.files[0];
    const verification = await onVerify(selectedId, file);
    setResult({
      ...verification,
      fileName: file.name,
    });
    event.target.value = '';
  };

  return (
    <div className="card verification-pane">
      <div>
        <h2>Automated Tamper Detection</h2>
        <p className="section-subtitle">
          Re-run hashing + Merkle proof validation in real-time. A mismatch flags tampering instantly.
        </p>
      </div>
      <div className="input-group">
        <label htmlFor="evidence-select">Select evidence record</label>
        <select
          id="evidence-select"
          className="selector"
          value={selectedId}
          onChange={handleSelect}
          disabled={isBusy || !evidence.length}
        >
          <option value="">{evidence.length ? 'Choose file to verify' : 'Upload evidence to enable'}</option>
          {evidence.map((item) => (
            <option key={item.id} value={item.id}>
              {item.fileName}
            </option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label htmlFor="verify-file">Provide file for verification</label>
        <input
          id="verify-file"
          type="file"
          disabled={!selectedId || isBusy}
          className="selector"
          onChange={handleFile}
        />
        <small style={{ color: '#64748b' }}>
          We never leave the browser — hashing and proof validation run locally.
        </small>
      </div>
      {result && (
        <div
          className={`banner ${result.status === 'verified' ? 'badge-verified' : 'badge-alert'}`}
          style={{ background: result.status === 'verified' ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.12)' }}
        >
          <strong>{result.status === 'verified' ? 'Evidence intact' : 'Tampering detected'}</strong>
          <div style={{ marginTop: '0.5rem' }}>
            <div>
              {result.status === 'verified'
                ? 'SHA-256 digest and Merkle proof match the anchored values.'
                : 'Computed digest or proof no longer matches the anchored state.'}
            </div>
            <div className="monospace" style={{ marginTop: '0.35rem' }}>
              expected: {result.expectedDigest?.slice(0, 24)}… · actual:{' '}
              {result.actualDigest?.slice(0, 24)}…
            </div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.82rem' }}>
              Checked {result.checkedAt ?? '—'} · Anchor tx {result.polygonTxHash}
            </div>
            <div style={{ marginTop: '0.2rem', fontSize: '0.82rem' }}>
              Verification tx {result.verificationTxHash}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TamperVerification;
