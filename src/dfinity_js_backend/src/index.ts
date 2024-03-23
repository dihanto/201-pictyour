// Imports
import {
  Canister,
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

// Type Definitions

// Record structure for representing picture data
const Picture = Record({
  id: text, // Unique identifier for the picture
  caption: text, // Caption for the picture
  like: nat32, // Number of likes for the picture
  pictureUrl: text, // URL of the picture
  seller: Principal, // Seller's principal (identity)
  price: nat64, // Price of the picture
  owned: text, // Ownership status of the picture
});

// Payload structure for creating/updating picture data
const PicturePayload = Record({
  caption: text, // Caption for the picture
  pictureUrl: text, // URL of the picture
  price: nat64, // Price of the picture
});

// Payload structure for updating picture data
const UpdatePicturePayload = Record({
  id: text, // Identifier of the picture to be updated
  caption: text, // New caption for the picture
  pictureUrl: text, // New URL of the picture
});

// Record structure for representing user data
const User = Record({
  id: text, // Unique identifier for the user
  name: text, // Name of the user
});

// Record structure for representing like data
const Like = Record({
  id: text, // Unique identifier for the like
  pictureId: text, // Identifier of the liked picture
  userId: text, // Identifier of the user who liked the picture
});

// Payload structure for creating a like
const LikePayload = Record({
  pictureId: text, // Identifier of the liked picture
  userId: text, // Identifier of the user who liked the picture
});

// Payload structure for initializing the application
const InitPayload = Record({
  orderFee: nat64, // Fee for processing orders
});

// Variant representing different statuses of an order
const OrderStatus = Variant({
  OrderPending: text, // Order is pending
  Completed: text, // Order is completed
});

// Record structure for representing an order
const Order = Record({
  pictureId: text, // Identifier of the ordered picture
  status: OrderStatus, // Status of the order
  amount: nat64, // Amount paid for the order
  payer: Principal, // Principal (identity) of the payer
  paid_at_block: Opt(nat64), // Block at which payment was made
  memo: nat64, // Memo associated with the order
});

// Variant representing different types of messages
const Message = Variant({
  Exists: text, // Entity already exists
  NotFound: text, // Entity not found
  InvalidPayload: text, // Invalid payload
  PaymentFailed: text, // Payment failed
  PaymentCompleted: text, // Payment completed
  Success: text, // Operation successful
  Fail: text, // Operation failed
});

// Variables
let orderFee: Opt<nat64> = None; // Initialize order fee as None

// Initialize Ledger canister with specific Principal
const icpCanister = Ledger(Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"));

// Initialize storage for pictures, likes, persisted orders, pending orders, and users
const pictureStorage = StableBTreeMap(0, text, Picture);
const likeStorage = StableBTreeMap(4, text, Like);
const persistedOrders = StableBTreeMap(1, Principal, Order);
const pendingOrders = StableBTreeMap(2, nat64, Order);
const userStorage = StableBTreeMap(3, text, User);

export default Canister({
  // Method for initializing data
  initData: init([InitPayload], (payload) => {
    orderFee = Some(payload.orderFee); // Set the order fee
  }),

  // Method for adding a new picture
  addPicture: update([PicturePayload], Result(Picture, Message), (payload) => {
    // Check if payload is valid
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
      return Err({ NotFound: "invalid payload" });
    }

    // Generate unique ID for the picture
    const picture = {
      id: uuidv4() as text, // Generate UUID for picture ID
      like: 0, // Initialize likes count
      owned: "No one", // Set initial ownership status
      seller: ic.caller(), // Set seller as the caller (user who added the picture)
      ...payload, // Merge payload data
    };

    // Insert picture into storage
    pictureStorage.insert(picture.id, picture);

    // Return success with added picture
    return Ok(picture);
  }),

  // Method for getting all pictures
  getPictures: query([], Vec(Picture), () => {
    return pictureStorage.values(); // Return all pictures from storage
  }),

  // Method for getting a specific picture by ID
  getPicture: query([text], Result(Picture, Message), (id) => {
    const pictureRes = pictureStorage.get(id);
    // Check if picture exists
    if ("None" in pictureRes) {
      return Err({ NotFound: `picture with id=${id} not found` });
    }
    // Return picture if found
    return Ok(pictureRes.Some);
  }),

  // Method for updating a picture
  updatePicture: update(
    [UpdatePicturePayload],
    Result(Picture, Message),
    (payload) => {
      // Retrieve existing picture
      const pictureRes = pictureStorage.get(payload.id);
      if ("None" in pictureRes) {
        return Err({ NotFound: `picture with id=${payload.id} not found` });
      }
      const picture = pictureRes.Some;

      // Update picture with payload data
      const updatedPicture = {
        ...picture,
        ...payload,
      };

      // Ensure that empty fields do not overwrite existing data
      if (payload.pictureUrl === "") {
        updatedPicture.pictureUrl = picture.pictureUrl;
      }
      if (payload.caption === "") {
        updatedPicture.caption = picture.caption;
      }

      // Update picture in storage
      pictureStorage.insert(picture.id, updatedPicture);

      // Return success with updated picture
      return Ok(updatedPicture);
    }
  ),

  // Method for adding a new user
  addUser: update([text], Result(User, Message), (name) => {
    // Create new user object
    const user = {
      id: uuidv4(), // Generate UUID for user ID
      name: name, // Set user name
    };

    // Insert user into storage
    userStorage.insert(user.id, user);

    // Return success with added user
    return Ok(user);
  }),

  // Method for getting a user by ID
  getUser: query([text], Result(User, Message), (id) => {
    // Retrieve user from storage
    const userRes = userStorage.get(id);
    // Return user if found
    return Ok(userRes.Some);
  }),

  // Method for getting all users
  getUsers: query([], Vec(User), () => {
    return userStorage.values(); // Return all users from storage
  }),

  // Method for liking a picture
  likePicture: update([LikePayload], Result(Like, Message), (payload) => {
    // Create new like object
    const like = {
      id: uuidv4(), // Generate UUID for like ID
      pictureId: payload.pictureId, // Set picture ID
      userId: payload.userId, // Set user ID
    };

    // Check if user has already liked the picture
    const likes = likeStorage.values();
    for (const existingLike of likes) {
      if (
        existingLike.userId === payload.userId &&
        existingLike.pictureId === payload.pictureId
      ) {
        return Err({ Exists: "User has already liked this picture." });
      }
    }

    // Update like count for the picture
    const pictureRes = pictureStorage.get(payload.pictureId);
    const picture = pictureRes.Some;
    const updatedPicture = {
      ...picture,
      like: picture.like + 1, // Increment like count
    };
    pictureStorage.insert(payload.pictureId, updatedPicture);

    // Insert like into storage
    likeStorage.insert(like.id, like);

    // Return success with added like
    return Ok(like);
  }),

  // Method for unliking a picture
  unlikePicture: update([text], Result(Like, Message), (likeId) => {
    // Retrieve like from storage
    const likeRes = likeStorage.get(likeId);
    const like = likeRes.Some;

    // Retrieve picture associated with the like
    const pictureRes = pictureStorage.get(like.pictureId);
    const picture = pictureRes.Some;

    // Update like count for the picture
    const updatedPicture = {
      ...picture,
      like: picture.like - 1, // Decrement like count
    };
    pictureStorage.insert(picture.id, updatedPicture);

    // Remove like from storage
    likeStorage.remove(likeId);

    // Return success with removed like
    return Ok(like);
  }),

  // Function for creating an order
  createOrder: update([text], Result(Order, Message), (pictureId) => {
    debugger;
    // Retrieve the picture associated with the given ID
    const pictureRes = pictureStorage.get(pictureId);

    // Check if the picture exists
    if ("None" in pictureRes) {
      return Err({ NotFound: `picture=${pictureId} not found` });
    }

    const picture = pictureRes.Some;
    // Calculate the total amount to be paid including the order fee
    let amountToBePaid = picture.price + orderFee.Some;

    // Create the order object
    const order = {
      amount: amountToBePaid,
      pictureId: pictureId,
      status: { OrderPending: "ORDER_PENDING" },
      payer: ic.caller(),
      paid_at_block: None,
      memo: generateCorrelationId(pictureId), // Generate a correlation ID for the order
    };

    // Insert the order into pending orders
    pendingOrders.insert(order.memo, order);

    return Ok(order);
  }),

  // Function for completing an order
  completeOrder: update(
    [text, nat64, nat64, text],
    Result(Order, Message),
    async (pictureId, block, memo, userId) => {
      debugger;
      // Retrieve the picture associated with the given ID
      const pictureRes = pictureStorage.get(pictureId);
      if ("None" in pictureRes) {
        throw Error(`picture with id=${pictureId} not found`);
      }
      const picture = pictureRes.Some;

      // Check if order fee is set
      if ("None" in orderFee) {
        return Err({
          NotFound: "order fee not set",
        });
      }

      let amount = picture.price + orderFee.Some;

      // Verify the payment
      const orderVerified = await verifyPaymentInternal(
        ic.caller(),
        amount,
        block,
        memo
      );

      // If payment verification fails, return an error
      if (!orderVerified) {
        return Err({
          NotFound: `cannot complete the order: cannot verify the payment, memo =${memo}`,
        });
      }

      // Make the payment
      const result = await makePayment(ic.caller(), orderFee.Some);
      if ("Err" in result) {
        return result;
      }

      // Remove the pending order
      const pendingOrderRes = pendingOrders.remove(memo);
      if ("None" in pendingOrderRes) {
        return Err({
          NotFound: `cannot complete the order, there is no pending order with id=${pictureId}`,
        });
      }

      const order = pendingOrderRes.Some;
      // Update order status to completed and set the payment block
      const updatedOrder = {
        ...order,
        status: { Completed: "COMPLETED" },
        paid_at_block: Some(block),
      };

      // Update picture ownership
      const updatedPicture = {
        ...picture,
        owned: userId,
      };
      pictureStorage.insert(pictureId, updatedPicture);

      // Persist the order and return the result
      persistedOrders.insert(ic.caller(), updatedOrder);
      return Ok(updatedOrder);
    }
  ),

  // Function for verifying a payment
  verifyPayment: query(
    [Principal, nat64, nat64, nat64],
    bool,
    async (receiver, amount, block, memo) => {
      // Call internal function to verify payment
      return await verifyPaymentInternal(receiver, amount, block, memo);
    }
  ),

  // Function for getting an address from principal
  getAddressFromPrincipal: query([Principal], text, (principal) => {
    // Get the hexadecimal address from the principal
    return hexAddressFromPrincipal(principal, 0);
  }),

  getPrincipalAddress: query([], text, () => {
    const principal = ic.caller();
    return hexAddressFromPrincipal(principal, 0);
  }),
});

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

// Helper function to generate correlation ids for orders
function generateCorrelationId(bookId: text): nat64 {
  const correlationId = `${bookId}_${ic.caller().toText()}_${ic.time()}`;
  return hash(correlationId);
}

// Helper function to generate a hash
function hash(input: any): nat64 {
  return BigInt(Math.abs(hashCode().value(input)));
}

// Helper function to verify payment
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
