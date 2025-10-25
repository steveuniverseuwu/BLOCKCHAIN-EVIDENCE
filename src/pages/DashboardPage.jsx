import { useMemo, useState } from 'react';
import EvidenceUpload from '../components/EvidenceUpload.jsx';
import EvidenceTable from '../components/EvidenceTable.jsx';
import BatchSummary from '../components/BatchSummary.jsx';
import TamperVerification from '../components/TamperVerification.jsx';
import SearchInput from '../components/SearchInput.jsx';
import { useEvidence } from '../state/EvidenceContext.jsx';
import { formatIsoTimestamp, formatFileSize } from '../utils/hashUtils.js';

function matchesQuery(value, query) {
  return String(value ?? '')
    .toLowerCase()
    .includes(query.toLowerCase());
}

function filterEvidence(items, query) {
  const trimmed = query.trim();
  if (!trimmed) return items;
  return items.filter((item) => {
    const fields = [
      item.fileName,
      item.fileType,
      item.ipfsCid,
      item.polygonTxHash,
      item.merkleRoot,
      item.zkp?.proofId,
    ];
    return fields.some((field) => matchesQuery(field, trimmed));
  });
}

function DashboardPage() {
  const {
    batches,
    allEvidence,
    registerBatch,
    verifyEvidence,
    retrieveEvidenceByCid,
    resetWorkspace,
  } = useEvidence();
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestBatch, setLatestBatch] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [viewer, setViewer] = useState({ status: 'idle' });
  const [searchQuery, setSearchQuery] = useState('');

  const handleUpload = async (files) => {
    try {
      setUploadError('');
      setIsProcessing(true);
      const batch = await registerBatch(files);
      setLatestBatch(batch);
    } catch (error) {
      setUploadError(error.message || 'Unable to register evidence batch.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async (record, overrideFile) => {
    let sourceBlob = overrideFile;
    let meta = {};

    if (overrideFile) {
      meta = { fileName: overrideFile.name, fileType: overrideFile.type || 'application/octet-stream' };
    } else {
      const asset = await retrieveEvidenceByCid(record.ipfsCid);
      if (!asset) {
        throw new Error('Asset not found in session IPFS mirror.');
      }
      sourceBlob = asset.blob;
      meta = { fileName: asset.fileName, fileType: asset.fileType };
    }

    const verification = await verifyEvidence(record.id, sourceBlob);
    return {
      ...verification,
      ...meta,
    };
  };

  const handleViewEvidence = async (record) => {
    setViewer({ status: 'loading', record });
    try {
      const asset = await retrieveEvidenceByCid(record.ipfsCid);
      setViewer({ status: 'ready', record, asset });
    } catch (error) {
      setViewer({
        status: 'error',
        record,
        message: error.message || 'Unable to fetch evidence from the IPFS mirror.',
      });
    }
  };

  const closeViewer = () => setViewer({ status: 'idle' });

  const intakeSummary = useMemo(() => {
    if (!latestBatch) return null;
    return {
      merkleRoot: latestBatch.merkleRoot,
      polygonTxHash: latestBatch.polygonTxHash,
      createdAt: latestBatch.createdAt,
      fileCount: latestBatch.fileCount,
    };
  }, [latestBatch]);

  const filteredEvidence = useMemo(
    () => filterEvidence(allEvidence, searchQuery),
    [allEvidence, searchQuery],
  );

  return (
    <>
      <section className="card">
        <h1 className="section-title">Real-Time ZKP-Verified Multimedia Evidence Protection</h1>
        <p className="section-subtitle">
          Client-side SHA-256 hashing, Merkle aggregation, deterministic IPFS CIDs, and Polygon transparency feeds —
          all inside a single-page MVP with zero backend dependencies.
        </p>
        <div className="banner">
          <strong>Session storage only.</strong> Data resets on refresh to demonstrate secure-by-default client
          workflows while preserving immutability on-chain.
        </div>
      </section>

      <div className="grid grid-2">
        <div className="card">
          <h2>Evidence Intake</h2>
          <EvidenceUpload onSelect={handleUpload} isProcessing={isProcessing} />
          {uploadError && (
            <div
              className="banner"
              style={{ marginTop: '1rem', background: 'rgba(248,113,113,0.12)', color: '#991b1b' }}
            >
              <strong>Upload failed:</strong> {uploadError}
            </div>
          )}
          {intakeSummary && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Latest anchored batch</h3>
              <div className="monospace" style={{ fontSize: '0.82rem' }}>
                Merkle root: {intakeSummary.merkleRoot}
              </div>
              <div className="monospace" style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>
                Polygon tx: {intakeSummary.polygonTxHash}
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                Included {intakeSummary.fileCount} item(s) · Anchored {formatIsoTimestamp(intakeSummary.createdAt)}
              </div>
            </div>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '1.5rem', justifyContent: 'center' }}
            onClick={() => {
              resetWorkspace();
              setLatestBatch(null);
              setViewer({ status: 'idle' });
            }}
            disabled={isProcessing || (!batches.length && !allEvidence.length)}
          >
            Reset session workspace
          </button>
        </div>
        <BatchSummary
          batches={batches}
          lastBatch={latestBatch ?? (batches.length ? batches[batches.length - 1] : null)}
        />
      </div>

      <section className="card">
        <div className="ledger-header">
          <h2>Evidence Ledger</h2>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search filename, CID, Merkle root, tx hash, or proof ID"
          />
        </div>
        <EvidenceTable evidence={filteredEvidence} onView={handleViewEvidence} />
      </section>

      {viewer.status !== 'idle' && (
        <section className="card viewer-card">
          <div className="viewer-header">
            <h2>IPFS Retrieval Demo</h2>
            <button type="button" className="btn btn-secondary btn-compact" onClick={closeViewer}>
              Close
            </button>
          </div>
          {viewer.status === 'loading' && (
            <p className="section-subtitle">
              Querying session-local IPFS mirror for CID {viewer.record.ipfsCid}...
            </p>
          )}
          {viewer.status === 'error' && (
            <div className="banner" style={{ background: 'rgba(248,113,113,0.12)', color: '#991b1b' }}>
              <strong>Mock retrieval failed:</strong> {viewer.message}
            </div>
          )}
          {viewer.status === 'ready' && (
            <div className="viewer-body">
              <div>
                <div className="monospace">CID: {viewer.record.ipfsCid}</div>
                <div className="viewer-meta">
                  <span>{viewer.asset.fileName}</span>
                  <span>{viewer.asset.fileType}</span>
                  <span>{formatFileSize(viewer.asset.fileSize)}</span>
                </div>
                <a href={viewer.asset.objectUrl} className="link-button" download={viewer.asset.fileName}>
                  Download from mock IPFS
                </a>
              </div>
              <div className="viewer-preview">
                {viewer.asset.fileType.startsWith('image/') ? (
                  <img src={viewer.asset.objectUrl} alt={viewer.asset.fileName} />
                ) : viewer.asset.fileType.startsWith('video/') ? (
                  <video src={viewer.asset.objectUrl} controls preload="metadata" />
                ) : (
                  <div className="banner">
                    Preview unavailable for this MIME type. Use the download link to inspect the evidence file.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <TamperVerification evidence={allEvidence} onVerify={handleVerify} isBusy={isProcessing} />
    </>
  );
}

export default DashboardPage;
