import {
  CancelSuccess,
  ClaimPayment,
  CreationSuccess,
  OpenSuccess,
} from "../generated/Maskbox/Maskbox";
import { Maskbox } from "../generated/schema";
import { CHAIN_ID } from "./constants";
import { fetchCustomerPurchasedNFTList, fetchNFTContract } from "./helpers";

export function handleCreationSuccess(event: CreationSuccess): void {
  let maskbox = new Maskbox(event.params.box_id.toString());

  let nftContract = fetchNFTContract(event.params.nft_address);
  nftContract.save();

  let boxId = event.params.box_id.toString();
  maskbox.chain_id = CHAIN_ID;
  maskbox.tx_hash = event.transaction.hash;
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
  maskbox.sold_nft_list = [];
  maskbox.canceled = false;
  maskbox.claimed = false;
  maskbox.save();
}

export function handleOpenSuccess(event: OpenSuccess): void {
  let maskbox = Maskbox.load(event.params.box_id.toString());

  if (maskbox.creator == event.params.customer && maskbox.sell_all) {
    return;
  }
  let nft_list = fetchCustomerPurchasedNFTList(
    event.params.box_id,
    event.params.customer
  );
  for (let i = 0; i < nft_list.length; ++i) {
    if (!maskbox.sold_nft_list.includes(nft_list[i])) {
      maskbox.sold_nft_list = maskbox.sold_nft_list.concat([nft_list[i]]);
    }
  }
  maskbox.save();
}

export function handleCancelSuccess(event: CancelSuccess): void {
  let maskbox = Maskbox.load(event.params.box_id.toString());

  maskbox.canceled = true;
  maskbox.save();
}

export function handleClaimPayment(event: ClaimPayment): void {
  let maskbox = Maskbox.load(event.params.box_id.toString());

  maskbox.claimed = true;
  maskbox.save();
}
