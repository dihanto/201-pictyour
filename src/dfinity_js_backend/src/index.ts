// Import statements grouped and organized
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

// Define types and data structures
type ID = text;
type UserID = text;
type Caption = text;
type PictureURL = text;
type Price = nat64;
type OrderFee = nat64;
type Timestamp = nat64;
type Memo = nat64;

type OrderStatus = Variant<{
  OrderPending: text;
  Completed: text;
}>;

// Define Records for data structures
const Picture = Record({
  id: ID,
  caption: Caption,
  like: nat32,
  pictureUrl: PictureURL,
  seller: Principal,
  price: Price,
  owned: text,
});

const PicturePayload = Record({
  caption: Caption,
  pictureUrl: PictureURL,
  price: Price,
});

const UpdatePicturePayload = Record({
  id: ID,
  caption: Caption,
  pictureUrl: PictureURL,
});

const User = Record({
  id: ID,
  name: text,
});

const Like = Record({
  id: ID,
  pictureId: ID,
  userId: UserID,
});

const LikePayload = Record({
  pictureId: ID,
  userId: UserID,
});

const InitPayload = Record({
  orderFee: OrderFee,
});

const Order = Record({
  pictureId: ID,
  status: OrderStatus,
  amount: Price,
  payer: Principal,
  paid_at_block: Opt<Timestamp>(nat64),
  memo: Memo,
});

const Message = Variant<{
  Exists: text;
  NotFound: text;
  InvalidPayload: text;
  PaymentFailed: text;
  PaymentCompleted: text;
  Success: text;
  Fail: text;
}>();

// Define the main Canister export
export default Canister({
  // Initialization function
  initData: init([InitPayload], (payload) => {
    orderFee = Some(payload.orderFee);
  }),

  // Function to add a picture
  addPicture: update([PicturePayload], Result(Picture, Message), (payload) => {
    if (!payload || Object.keys(payload).length === 0) {
      return Err({ NotFound: "Invalid payload" });
    }

    const pictureId = uuidv4() as ID;
    const picture: Picture = {
      id: pictureId,
      like: 0,
      owned: "No one",
      seller: ic.caller(),
      ...payload,
    };

    pictureStorage.insert(pictureId, picture);
    return Ok(picture);
  }),

  // Function to get all pictures
  getPictures: query([], Vec(Picture), () => pictureStorage.values()),

  // Function to get a specific picture by ID
  getPicture: query([text], Result(Picture, Message), (id) => {
    const picture = pictureStorage.get(id);
    return picture ? Ok(picture) : Err({ NotFound: `Picture with ID ${id} not found` });
  }),

  // Function to update a picture
  updatePicture: update(
    [UpdatePicturePayload],
    Result(Picture, Message),
    (payload) => {
      const picture = pictureStorage.get(payload.id);
      if (!picture) {
        return Err({ NotFound: `Picture with ID ${payload.id} not found` });
      }

      const updatedPicture = { ...picture, ...payload };
      pictureStorage.insert(payload.id, updatedPicture);
      return Ok(updatedPicture);
    }
  ),

  // Function to add a user
  addUser: update([text], Result(User, Message), (name) => {
    const userId = uuidv4() as ID;
    const user: User = { id: userId, name };
    userStorage.insert(userId, user);
    return Ok(user);
  }),

  // Function to get a user by ID
  getUser: query([text], Result(User, Message), (id) => {
    const user = userStorage.get(id);
    return user ? Ok(user) : Err({ NotFound: `User with ID ${id} not found` });
  }),

  // Function to get all users
  getUsers: query([], Vec(User), () => userStorage.values()),

  // Function to like a picture
  likePicture: update([LikePayload], Result(Like, Message), (payload) => {
    const likeId = uuidv4() as ID;
    const like: Like = { id: likeId, ...payload };

    const existingLike = likeStorage.values().find(
      (l) => l.userId === payload.userId && l.pictureId === payload.pictureId
    );

    if (existingLike) {
      return Err({ Exists: "User has already liked this picture." });
    }

    const picture = pictureStorage.get(payload.pictureId);
    if (!picture) {
      return Err({ NotFound: `Picture with ID ${payload.pictureId} not found` });
    }

    const updatedPicture = { ...picture, like: picture.like + 1 };
    pictureStorage.insert(payload.pictureId, updatedPicture);
    likeStorage.insert(likeId, like);
    return Ok(like);
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
