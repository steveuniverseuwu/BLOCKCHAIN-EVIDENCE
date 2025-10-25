import { useMemo, useState } from 'react';
import { useEvidence } from '../state/EvidenceContext.jsx';
import { formatIsoTimestamp } from '../utils/hashUtils.js';
import SearchInput from '../components/SearchInput.jsx';

function renderDetails(event) {
  if (event.type === 'ANCHOR') {
    return (
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        <span className="pill">{event.fileCount} file(s)</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {(event.proofIds ?? []).map((proof) => (
            <span key={proof} className="badge badge-waiting">
              {proof}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '0.35rem' }}>
      <span className={`badge ${event.status === 'verified' ? 'badge-verified' : 'badge-alert'}`}>
        {event.status === 'verified' ? 'Proof valid' : 'Tampering detected'}
      </span>
      <span style={{ fontSize: '0.8rem', color: 'rgba(226,232,255,0.65)' }}>{event.fileName}</span>
    </div>
  );
}

function PolygonTransparencyPage() {
  const { events } = useEvidence();
  const [searchQuery, setSearchQuery] = useState('');

  const transactions = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    );
    const filtered = sorted.filter((event) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      const targets = [
        event.polygonTxHash,
        event.merkleRoot,
        event.fileName,
        ...(event.proofIds ?? []),
        event.type,
      ];
      return targets.some((target) => String(target ?? '').toLowerCase().includes(query));
    });
    return filtered.map((event, index) => ({
      ...event,
      sequence: filtered.length - index,
    }));
  }, [events, searchQuery]);

  return (
    <>
      <section className="card">
        <h1 className="section-title">PolygonScan Transparency Mirror</h1>
        <p className="section-subtitle">
          Every integrity action emits a synthetic Polygon transaction hash. Anchors register Merkle roots, and
          verification replays publish their validation results for downstream auditors.
        </p>
      </section>

      {!transactions.length ? (
        <div className="banner">
          <strong>No transactions yet.</strong> Upload evidence batches or verify existing items to populate the
          Polygon transparency ledger.
        </div>
      ) : (
        <div className="card">
          <div className="ledger-header">
            <h2>Activity Feed</h2>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search txn hash, Merkle root, proof ID, or file"
            />
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Txn Hash</th>
                  <th>Subject</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td>{txn.sequence}</td>
                    <td>
                      <span className="badge badge-waiting">
                        {txn.type === 'ANCHOR' ? 'Anchor' : 'Verification'}
                      </span>
                    </td>
                    <td className="monospace">{txn.polygonTxHash}</td>
                    <td className="monospace">{txn.merkleRoot ?? '—'}</td>
                    <td>{renderDetails(txn)}</td>
                    <td>{formatIsoTimestamp(txn.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default PolygonTransparencyPage;
