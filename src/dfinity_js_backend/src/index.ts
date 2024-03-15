import {
  Canister,
  Duration,
  Err,
  None,
  Ok,
  Opt,
  Principal,
  Record,
  Result,
  Some,
  StableBTreeMap,
  Variant,
  Vec,
  bool,
  ic,
  init,
  nat32,
  nat64,
  query,
  text,
  update,
} from "azle";

import {
  Ledger,
  binaryAddressFromAddress,
  binaryAddressFromPrincipal,
  hexAddressFromPrincipal,
} from "azle/canisters/ledger";

import { hashCode } from "hashcode";
import { v4 as uuidv4 } from "uuid";

const Picture = Record({
  id: text,
  caption: text,
  like: nat32,
  pictureUrl: text,
  seller: Principal,
  price: nat64,
  owned: text,
});

const PicturePayload = Record({
  caption: text,
  pictureUrl: text,
  price: nat64,
});

const UpdatePicturePayload = Record({
  id: text,
  caption: text,
  pictureUrl: text,
});

const User = Record({
  id: text,
  name: text,
});

const InitPayload = Record({
  orderFee: nat64,
});

const OrderStatus = Variant({
  OrderPending: text,
  Completed: text,
});

const Order = Record({
  pictureId: text,
  status: OrderStatus,
  amount: nat64,
  payer: Principal,
  paid_at_block: Opt(nat64),
  memo: nat64,
});

const Message = Variant({
  Exists: text,
  NotFound: text,
  InvalidPayload: text,
  PaymentFailed: text,
  PaymentCompleted: text,
  Success: text,
  Fail: text,
});

let orderFee: Opt<nat64> = None;

const icpCanister = Ledger(Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"));

const pictureStorage = StableBTreeMap(0, text, Picture);
const persistedOrders = StableBTreeMap(1, Principal, Order);
const pendingOrders = StableBTreeMap(2, nat64, Order);

const userStorage = StableBTreeMap(3, text, User);

export default Canister({
  initData: init([InitPayload], (payload) => {
    orderFee = Some(payload.orderFee);
  }),

  addPicture: update([PicturePayload], Result(Picture, Message), (payload) => {
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
      return Err({ NotFound: "invalid payload" });
    }

    const picture = {
      id: uuidv4() as text,
      like: 0,
      owned: "No one",
      seller: ic.caller(),
      ...payload,
    };
    pictureStorage.insert(picture.id, picture);
    return Ok(picture);
  }),

  getPictures: query([], Vec(Picture), () => {
    return pictureStorage.values();
  }),

  getPicture: query([text], Result(Picture, Message), (id) => {
    const pictureRes = pictureStorage.get(id);
    if ("None" in pictureRes) {
      return Err({ NotFound: `picture with id=${id} not found` });
    }
    return Ok(pictureRes.Some);
  }),

  updatePicture: update(
    [UpdatePicturePayload],
    Result(Picture, Message),
    (payload) => {
      const pictureRes = pictureStorage.get(payload.id);
      if ("None" in pictureRes) {
        return Err({ NotFound: `picture with id=${payload.id} not found` });
      }
      const picture = pictureRes.Some;

      const updatedPicture = {
        ...picture,
        ...payload,
      };

      if (payload.pictureUrl === "") {
        updatedPicture.pictureUrl = picture.pictureUrl;
      }

      if (payload.caption === "") {
        updatedPicture.caption = picture.caption;
      }

      pictureStorage.insert(picture.id, updatedPicture);
      return Ok(updatedPicture);
    }
  ),

  addUser: update([text], Result(User, Message), (name) => {
    const user = {
      id: uuidv4(),
      name: name,
    };

    userStorage.insert(user.id, user);
    return Ok(user);
  }),

  getUser: query([text], Result(User, Message), (id) => {
    const userRes = userStorage.get(id);
    return Ok(userRes.Some);
  }),

  getUsers: query([], Vec(User), () => {
    return userStorage.values();
  }),

  createOrder: update([text], Result(Order, Message), (pictureId) => {
    const pictureRes = pictureStorage.get(pictureId);

    if ("None" in pictureRes) {
      return Err({ NotFound: `picture=${pictureId} not found` });
    }

    const picture = pictureRes.Some;
    let amountToBePaid = picture.price + orderFee.Some;

    const order = {
      amount: amountToBePaid,
      pictureId: pictureId,
      status: { OrderPending: "ORDER_PENDING" },
      payer: ic.caller(),
      paid_at_block: None,
      memo: generateCorrelationId(pictureId),
    };

    pendingOrders.insert(order.memo, order);

    return Ok(order);
  }),

  completeOrder: update(
    [text, nat64, nat64, text],
    Result(Order, Message),
    async (pictureId, block, memo, userId) => {
      const pictureRes = pictureStorage.get(pictureId);
      if ("None" in pictureRes) {
        throw Error(`picture with id=${pictureId} not found`);
      }
      const picture = pictureRes.Some;

      if ("None" in orderFee) {
        return Err({
          NotFound: "order fee not set",
        });
      }

      let amount = picture.price + orderFee.Some;

      const orderVerified = await verifyPaymentInternal(
        ic.caller(),
        amount,
        block,
        memo
      );

      if (!orderVerified) {
        return Err({
          NotFound: `cannot complete the order: cannot verify the payment, memo =${memo}`,
        });
      }

      const result = await makePayment(ic.caller(), orderFee.Some);
      if ("Err" in result) {
        return result;
      }

      const pendingOrderRes = pendingOrders.remove(memo);
      if ("None" in pendingOrderRes) {
        return Err({
          NotFound: `cannot complete the order, there is no pending order with id=${pictureId}`,
        });
      }

      const order = pendingOrderRes.Some;
      const updatedOrder = {
        ...order,
        status: { Completed: "COMPLETED" },
        paid_at_block: Some(block),
      };

      const updatedPicture = {
        ...picture,
        owned: userId,
      };
      pictureStorage.insert(pictureId, updatedPicture);

      persistedOrders.insert(ic.caller(), updatedOrder);
      return Ok(updatedOrder);
    }
  ),

  verifyPayment: query(
    [Principal, nat64, nat64, nat64],
    bool,
    async (receiver, amount, block, memo) => {
      return await verifyPaymentInternal(receiver, amount, block, memo);
    }
  ),

  /*
    a helper function to get address from the principal
    the address is later used in the transfer method
*/
  getAddressFromPrincipal: query([Principal], text, (principal) => {
    return hexAddressFromPrincipal(principal, 0);
  }),
});

/*
    a hash function that is used to generate correlation ids for orders.
    also, we use that in the verifyPayment function where we check if the used has actually paid the order
*/
function hash(input: any): nat64 {
  return BigInt(Math.abs(hashCode().value(input)));
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};

async function makePayment(address: Principal, amount: nat64) {
  const toAddress = hexAddressFromPrincipal(address, 0);
  const transferFeeResponse = await ic.call(icpCanister.transfer_fee, {
    args: [{}],
  });
  const transferResult = ic.call(icpCanister.transfer, {
    args: [
      {
        memo: 0n,
        amount: {
          e8s: amount - transferFeeResponse.transfer_fee.e8s,
        },
        fee: {
          e8s: transferFeeResponse.transfer_fee.e8s,
        },
        from_subaccount: None,
        to: binaryAddressFromAddress(toAddress),
        created_at_time: None,
      },
    ],
  });
  if ("Err" in transferResult) {
    return Err({ PaymentFailed: `refund failed, err=${transferResult.Err}` });
  }
  return Ok({ PaymentCompleted: "refund completed" });
}

// HELPER FUNCTIONS
function generateCorrelationId(bookId: text): nat64 {
  const correlationId = `${bookId}_${ic.caller().toText()}_${ic.time()}`;
  return hash(correlationId);
}

/*
  after the order is created, we give the `delay` amount of minutes to pay for the order.
  if it's not paid during this timeframe, the order is automatically removed from the pending orders.
*/
function discardByTimeout(memo: nat64, delay: Duration) {
  ic.setTimer(delay, () => {
    const order = pendingOrders.remove(memo);
    console.log(`Reserve discarded ${order}`);
  });
}

async function verifyPaymentInternal(
  receiver: Principal,
  amount: nat64,
  block: nat64,
  memo: nat64
): Promise<bool> {
  const blockData = await ic.call(icpCanister.query_blocks, {
    args: [{ start: block, length: 1n }],
  });
  const tx = blockData.blocks.find((block) => {
    if ("None" in block.transaction.operation) {
      return false;
    }
    const operation = block.transaction.operation.Some;
    const senderAddress = binaryAddressFromPrincipal(ic.caller(), 0);
    const receiverAddress = binaryAddressFromPrincipal(receiver, 0);
    return (
      block.transaction.memo === memo &&
      hash(senderAddress) === hash(operation.Transfer?.from) &&
      hash(receiverAddress) === hash(operation.Transfer?.to) &&
      amount === operation.Transfer?.amount.e8s
    );
  });
  return tx ? true : false;
}
