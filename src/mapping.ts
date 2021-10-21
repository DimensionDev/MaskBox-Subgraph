import { CreationSuccess } from "../generated/Maskbox/Maskbox";
import { Maskbox } from "../generated/schema";
import { CHAIN_ID } from "./constants";
import { fetchNFTContract } from "./helpers";

export function handleCreationSuccess(event: CreationSuccess): void {
  let txHash = event.transaction.hash.toHexString();
  let maskbox = new Maskbox(txHash);

  let nftContract = fetchNFTContract(event.params.nft_address);
  nftContract.save();

  let boxId = event.params.box_id.toString();
  maskbox.chain_id = CHAIN_ID;
  maskbox.box_id = boxId;
  maskbox.blockNumber = event.block.number;
  maskbox.creator = event.params.creator;
  maskbox.nft_address = event.params.nft_address;
  maskbox.name = event.params.name;
  maskbox.start_time = event.params.start_time.toI32();
  maskbox.end_time = event.params.end_time.toI32();
  maskbox.sell_all = event.params.sell_all;
  maskbox.nft_contract = nftContract.id;
  maskbox.create_time = event.block.timestamp.toI32();
  maskbox.save();
}
