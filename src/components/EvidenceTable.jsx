import { formatFileSize, formatIsoTimestamp } from '../utils/hashUtils.js';

function shorten(value, chars = 6) {
  if (!value) return '—';
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  if (clean.length <= chars * 2) return value;
  return `${value.slice(0, chars + (value.startsWith('0x') ? 2 : 0))}…${value.slice(-chars)}`;
}

function EvidenceTable({ evidence, onView }) {
  if (!evidence.length) {
    return (
      <div className="banner">
        <strong>No evidence yet.</strong> Upload multimedia files to see automatic hashing, Merkle aggregation,
        and Polygon anchoring details appear here.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Evidence</th>
            <th>Size</th>
            <th>Anchored</th>
            <th>IPFS CID</th>
            <th>Merkle Proof</th>
            <th>ZKP</th>
            <th>Polygon Tx</th>
            <th>Access</th>
          </tr>
        </thead>
        <tbody>
          {evidence.map((item) => (
            <tr key={item.id}>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>{item.fileName}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.fileType}</span>
                </div>
              </td>
              <td>{formatFileSize(item.fileSize)}</td>
              <td>{formatIsoTimestamp(item.uploadedAt)}</td>
              <td className="monospace">{shorten(item.ipfsCid, 8)}</td>
              <td>
                <span className="badge badge-waiting">
                  {item.merkleProof?.length ?? 0} hashes
                </span>
              </td>
              <td>
                <span className="badge badge-verified">Verified</span>
              </td>
              <td className="monospace">{shorten(item.polygonTxHash)}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => onView?.(item)}
                  disabled={!onView}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EvidenceTable;
