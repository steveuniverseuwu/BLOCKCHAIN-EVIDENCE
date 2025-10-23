import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  computeSha256Hex,
  createIpfsCid,
  generatePolygonTxHash,
  generateProofId,
  formatIsoTimestamp,
  randomId,
} from '../utils/hashUtils.js';
import { buildMerkleTree, verifyProof } from '../utils/merkle.js';

const EvidenceContext = createContext(undefined);

function flattenBatches(batches) {
  return batches.flatMap((batch) => batch.evidence);
}

export function EvidenceProvider({ children }) {
  const [batches, setBatches] = useState([]);
  const [events, setEvents] = useState([]);
  const assetRegistryRef = useRef(new Map());

  const allEvidence = useMemo(() => flattenBatches(batches), [batches]);

  useEffect(
    () => () => {
      assetRegistryRef.current.forEach((asset) => {
        if (asset.objectUrl) {
          URL.revokeObjectURL(asset.objectUrl);
        }
      });
      assetRegistryRef.current.clear();
    },
    [],
  );

  const registerBatch = useCallback(async (fileList) => {
    const files = Array.from(fileList ?? []).filter((file) => file?.size);
    if (!files.length) {
      return null;
    }

    const preparedEvidence = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const digestHex = await computeSha256Hex(arrayBuffer);
        const ipfsCid = await createIpfsCid(arrayBuffer);
        const blob = new Blob([arrayBuffer], {
          type: file.type || 'application/octet-stream',
        });
        const objectUrl = URL.createObjectURL(blob);
        assetRegistryRef.current.set(ipfsCid, {
          blob,
          objectUrl,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
        });
        return {
          id: randomId('evidence'),
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          digestHex,
          ipfsCid,
        };
      }),
    );

    const leaves = preparedEvidence.map((item) => item.digestHex);
    const { root: merkleRoot, proofs } = await buildMerkleTree(leaves);
    const polygonTxHash = generatePolygonTxHash();
    const anchoredAt = new Date().toISOString();
    const batchId = randomId('batch');

    const evidenceWithAnchors = preparedEvidence.map((item, index) => ({
      ...item,
      batchId,
      merkleRoot,
      polygonTxHash,
      merkleProof: proofs[index],
      anchoredAt,
      zkp: {
        proofId: generateProofId(),
        status: 'verified',
        verifiedAt: anchoredAt,
      },
    }));

    const batch = {
      id: batchId,
      createdAt: anchoredAt,
      merkleRoot,
      polygonTxHash,
      evidence: evidenceWithAnchors,
      fileCount: evidenceWithAnchors.length,
    };

    setBatches((prev) => [...prev, batch]);
    setEvents((prev) => [
      {
        id: randomId('event'),
        type: 'ANCHOR',
        createdAt: anchoredAt,
        polygonTxHash,
        merkleRoot,
        fileCount: evidenceWithAnchors.length,
        proofIds: evidenceWithAnchors.map((item) => item.zkp?.proofId).filter(Boolean),
        batchId,
      },
      ...prev,
    ]);
    return batch;
  }, []);

  const verifyEvidence = useCallback(
    async (evidenceId, file) => {
      const evidenceRecord = allEvidence.find((item) => item.id === evidenceId);
      if (!evidenceRecord) {
        return {
          status: 'error',
          message: 'Evidence record not found.',
        };
      }

      const arrayBuffer = await file.arrayBuffer();
      const digestHex = await computeSha256Hex(arrayBuffer);
      const digestMatches = digestHex === evidenceRecord.digestHex;

      const proofVerification = evidenceRecord.merkleRoot
        ? await verifyProof(digestHex, evidenceRecord.merkleProof, evidenceRecord.merkleRoot)
        : false;

      const verificationTxHash = generatePolygonTxHash();
      const checkedAt = new Date().toISOString();
      setEvents((prev) => [
        {
          id: randomId('event'),
          type: 'VERIFICATION',
          createdAt: checkedAt,
          polygonTxHash: verificationTxHash,
          status: digestMatches && proofVerification ? 'verified' : 'tampered',
          merkleRoot: evidenceRecord.merkleRoot,
          evidenceId,
          fileName: evidenceRecord.fileName,
          batchId: evidenceRecord.batchId,
        },
        ...prev,
      ]);

      return {
        status: digestMatches && proofVerification ? 'verified' : 'tampered',
        digestMatches,
        proofVerification,
        expectedDigest: evidenceRecord.digestHex,
        actualDigest: digestHex,
        anchoredAt: formatIsoTimestamp(evidenceRecord.anchoredAt),
        merkleRoot: evidenceRecord.merkleRoot,
        polygonTxHash: evidenceRecord.polygonTxHash,
        proofId: evidenceRecord.zkp?.proofId,
        verificationTxHash,
        checkedAt: formatIsoTimestamp(checkedAt),
      };
    },
    [allEvidence],
  );

  const retrieveEvidenceByCid = useCallback(async (cid) => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(450);
    const asset = assetRegistryRef.current.get(cid);
    if (!asset) {
      throw new Error('No asset found for the requested CID.');
    }
    return {
      cid,
      ...asset,
    };
  }, []);

  const resetWorkspace = useCallback(() => {
    assetRegistryRef.current.forEach((asset) => {
      if (asset.objectUrl) {
        URL.revokeObjectURL(asset.objectUrl);
      }
    });
    assetRegistryRef.current.clear();
    setBatches([]);
    setEvents([]);
  }, []);

  const contextValue = useMemo(
    () => ({
      batches,
      allEvidence,
      events,
      registerBatch,
      verifyEvidence,
       retrieveEvidenceByCid,
      resetWorkspace,
    }),
    [batches, allEvidence, events, registerBatch, verifyEvidence, retrieveEvidenceByCid, resetWorkspace],
  );

  return (
    <EvidenceContext.Provider value={contextValue}>
      {children}
    </EvidenceContext.Provider>
  );
}

export function useEvidence() {
  const context = useContext(EvidenceContext);
  if (!context) {
    throw new Error('useEvidence must be used inside EvidenceProvider');
  }
  return context;
}
