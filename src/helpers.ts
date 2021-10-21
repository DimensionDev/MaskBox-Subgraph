import { Address } from "@graphprotocol/graph-ts";
import { NFTContract } from "../generated/schema";
import { CHAIN_ID, ERC721, ERC721NameBytes } from "./constants";

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

export function fetchNFTContract(tokenAddress: Address): NFTContract {
  let nftContract = NFTContract.load(tokenAddress.toHexString());
  if (nftContract == null) {
    nftContract = new NFTContract(tokenAddress.toHexString());
  }
  nftContract.chain_id = CHAIN_ID;
  nftContract.address = tokenAddress;
  nftContract.name = fetchNFTContractName(tokenAddress);
  return nftContract as NFTContract;
}

export function fetchNFTContractName(address: Address): string {
  let contract = ERC721.bind(address);
  let contractNameBytes = ERC721NameBytes.bind(address);

  // try types string and bytes32 for name
  let nameValue = "unknown";
  let nameResult = contract.try_name();
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}
