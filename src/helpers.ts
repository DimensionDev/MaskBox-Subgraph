import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { NFTContract } from "../generated/schema";
import {
  CHAIN_ID,
  ERC721,
  MaskboxContract,
  ERC721NameBytes,
  MASKBOX_CONTRACT_ADDRESS,
} from "./constants";

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

export function fetchCustomerPurchasedNFTList(
  boxId: BigInt,
  customer: Address
): BigInt[] {
  let contract = MaskboxContract.bind(
    Address.fromString(MASKBOX_CONTRACT_ADDRESS)
  );
  let nftListResult = contract.try_getPurchasedNft(boxId, customer);
  if (nftListResult.reverted) {
    log.error(`Fails to getPurchasedNft of %s for boxId: %s`, [
      boxId.toString(),
      customer.toHexString(),
    ]);
    return [];
  }
  return nftListResult.value;
}
