import { BigInt } from "@graphprotocol/graph-ts";
import {
  CancelSuccess,
  ClaimPayment,
  CreationSuccess,
  OpenSuccess,
} from "../generated/Maskbox/Maskbox";
import { Maskbox, MaskboxStatistic, User } from "../generated/schema";
import { CHAIN_ID } from "./constants";
import { fetchCustomerPurchasedNFTList, fetchNFTContract } from "./helpers";

export function handleCreationSuccess(event: CreationSuccess): void {
  let maskbox = new Maskbox(event.params.box_id.toString());
  let totalCreatorId: string = "0x0000000000000000000000000000000000000000";
  let totalStatistic = MaskboxStatistic.load(totalCreatorId);
  if (totalStatistic == null) {
    totalStatistic = new MaskboxStatistic(totalCreatorId);
    totalStatistic.total = 0;
  }

  let creatorHex = event.params.creator.toHexString();
  let creatorStatistic = MaskboxStatistic.load(creatorHex);
  if (creatorStatistic == null) {
    creatorStatistic = new MaskboxStatistic(creatorHex);
    creatorStatistic.total = 0;
  }

  let nftContract = fetchNFTContract(event.params.nft_address);
  nftContract.save();

  let boxId = event.params.box_id.toI32();
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
  maskbox.drawed_by_customer = [];
  maskbox.canceled = false;
  maskbox.claimed = false;
  maskbox.save();

  creatorStatistic.total = creatorStatistic.total + 1;
  creatorStatistic.save();
  totalStatistic.total = totalStatistic.total + 1;
  totalStatistic.save();
}

function listAdd<T>(list: T[], item: T): T[] {
  if (!list.includes(item)) {
    return list.concat([item]);
  }
  return list;
}

function listPreadd<T>(list: T[], item: T): T[] {
  let index = list.indexOf(item);
  let arr: T[] = [item];
  if (index === -1) {
    return arr.concat(list);
  } else {
    let copy = list.slice();
    copy.splice(index, 1);
    return arr.concat(copy);
  }
}

export function handleOpenSuccess(event: OpenSuccess): void {
  let maskbox = Maskbox.load(event.params.box_id.toString());
  let user = User.load(event.params.customer.toHexString());

  if (user == null) {
    user = new User(event.params.customer.toHexString());
    user.nft_contracts = [];
  }

  user.nft_contracts = listPreadd<string>(
    user.nft_contracts,
    maskbox.nft_contract
  );
  user.save();

  let nft_list = fetchCustomerPurchasedNFTList(
    event.params.box_id,
    event.params.customer
  );
  let is_creator = maskbox.creator === event.params.customer;
  for (let i = 0; i < nft_list.length; ++i) {
    maskbox.sold_nft_list = listAdd<BigInt>(maskbox.sold_nft_list, nft_list[i]);
    if (!is_creator) {
      maskbox.drawed_by_customer = listAdd<BigInt>(
        maskbox.drawed_by_customer,
        nft_list[i]
      );
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
