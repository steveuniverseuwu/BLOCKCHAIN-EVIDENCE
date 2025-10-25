import { useRef } from 'react';

function EvidenceUpload({ onSelect, isProcessing }) {
  const inputRef = useRef(null);

  const handleZoneClick = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleZoneClick();
    }
  };

  const handleChange = (event) => {
    if (!event.target.files?.length) return;
    onSelect(event.target.files);
    event.target.value = '';
  };

  return (
    <div
      className="upload-zone"
      role="button"
      tabIndex={0}
      onClick={handleZoneClick}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={inputRef}
        type="file"
        name="evidence"
        id="evidence"
        multiple
        onChange={handleChange}
        accept="*/*"
      />
      <h2>Drop digital evidence or click to browse</h2>
      <p className="upload-hint">
        We hash files locally, compute a Merkle tree, craft an IPFS CID, and simulate Polygon anchoring.
      </p>
      <div style={{ marginTop: '1.1rem', fontSize: '0.85rem', color: 'rgba(248, 250, 255, 0.75)' }}>
        {isProcessing ? 'Processing batch...' : 'Supports batch uploads for Merkle aggregation'}
      </div>
    </div>
  );
}

export default EvidenceUpload;
