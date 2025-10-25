import { formatIsoTimestamp } from '../utils/hashUtils.js';

function BatchSummary({ batches, lastBatch }) {
  const totalEvidence = batches.reduce((sum, batch) => sum + batch.fileCount, 0);

  if (!batches.length) {
    return (
      <div className="card">
        <h2>Integrity Anchoring Pipeline</h2>
        <p>
          Each upload batch generates a Merkle tree root, a deterministic IPFS content identifier, and a simulated
          Polygon transaction hash for transparency.
        </p>
        <ul className="timeline">
          <li>
            <span className="timeline-dot" />
            <div>
              <strong>Step 1</strong>
              <p>Client-side SHA-256 hashing per file</p>
            </div>
          </li>
          <li>
            <span className="timeline-dot" />
            <div>
              <strong>Step 2</strong>
              <p>Merkle tree aggregation + zero-knowledge verification stamp</p>
            </div>
          </li>
          <li>
            <span className="timeline-dot" />
            <div>
              <strong>Step 3</strong>
              <p>Polygon anchoring + PolygonScan transparency feed</p>
            </div>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Integrity Anchoring Stats</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Batches</span>
          <span className="stat-value">{batches.length}</span>
          <span className="stat-meta">Merkle roots anchored this session</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Evidence Items</span>
          <span className="stat-value">{totalEvidence}</span>
          <span className="stat-meta">Files protected in-memory</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Latest Root</span>
          <span className="stat-meta monospace">
            {lastBatch?.merkleRoot ? `${lastBatch.merkleRoot.slice(0, 18)}…` : '—'}
          </span>
          <span className="stat-meta">
            Anchored {lastBatch?.createdAt ? formatIsoTimestamp(lastBatch.createdAt) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BatchSummary;
