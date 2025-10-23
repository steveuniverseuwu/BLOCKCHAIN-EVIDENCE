import { hashHexPair } from './hashUtils.js';

function buildProofForIndex(index, layers) {
  if (layers.length <= 1) {
    return [];
  }

  const proof = [];
  let idx = index;

  for (let depth = 0; depth < layers.length - 1; depth += 1) {
    const layer = layers[depth];
    if (layer.length === 1) {
      continue;
    }

    const isRightNode = idx % 2 === 1;
    const siblingIndex = isRightNode ? idx - 1 : idx + 1;
    const siblingHash =
      siblingIndex >= layer.length ? layer[idx] : layer[siblingIndex];

    proof.push({
      position: isRightNode ? 'left' : 'right',
      hash: siblingHash,
    });

    idx = Math.floor(idx / 2);
  }

  return proof;
}

export async function buildMerkleTree(leaves) {
  if (!leaves.length) {
    return {
      root: null,
      layers: [],
      proofs: [],
    };
  }

  const layers = [leaves];
  let currentLayer = leaves;
  while (currentLayer.length > 1) {
    const nextLayer = [];
    for (let index = 0; index < currentLayer.length; index += 2) {
      const left = currentLayer[index];
      const right = currentLayer[index + 1] ?? currentLayer[index];
      const parentHash = await hashHexPair(left, right);
      nextLayer.push(parentHash);
    }
    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  const root = currentLayer[0];
  const proofs = leaves.map((_, index) => buildProofForIndex(index, layers));
  return { root, layers, proofs };
}

export async function verifyProof(leafHash, proof, root) {
  if (!root) return false;
  let computedHash = leafHash;

  for (const { position, hash } of proof ?? []) {
    computedHash =
      position === 'left'
        ? await hashHexPair(hash, computedHash)
        : await hashHexPair(computedHash, hash);
  }

  return computedHash === root;
}
