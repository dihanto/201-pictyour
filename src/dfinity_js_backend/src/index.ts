import {
  Canister,
  Err,
  Ok,
  Principal,
  Record,
  Result,
  StableBTreeMap,
  Variant,
  Vec,
  ic,
  nat32,
  query,
  text,
  update,
} from "azle";
import { v4 as uuidv4 } from "uuid";

const Picture = Record({
  id: text,
  caption: text,
  like: nat32,
  pictureUrl: text,
  seller: Principal,
});

const PicturePayload = Record({
  caption: text,
  like: nat32,
  pictureUrl: text,
});

const UpdatePicturePayload = Record({
  id: text,
  caption: text,
  pictureUrl: text,
});

const User = Record({
  id: text,
  name: text,
  username: text,
  orders: Vec(text),
});

const UserPayload = Record({
  name: text,
  username: text,
});

const UpdateUserPayload = Record({
  id: text,
  name: text,
});

const Order = Record({
  id: text,
  pictureId: text,
  userId: text,
});

const OrderPayload = Record({
  pictureId: text,
  userId: text,
});

const OrderReturn = Record({
  id: text,
  pictureId: text,
  userId: text,
  username: text,
});

const Error = Variant({
  NotFound: text,
  Unauthorized: text,
  BadRequest: text,
});

const pictureStorage = StableBTreeMap(0, text, Picture);
const userStorage = StableBTreeMap(3, text, User);

export default Canister({
  addPicture: update([PicturePayload], Result(Picture, Error), (payload) => {
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
      return Err({ NotFound: "invalid payload" });
    }

    const picture = {
      id: uuidv4(),
      seller: ic.caller(),
      ...payload,
    };
    pictureStorage.insert(picture.id, picture);
    return Ok(picture);
  }),
  getPictures: query([], Vec(Picture), () => {
    return pictureStorage.values();
  }),
  getPicture: query([text], Result(Picture, Error), (id) => {
    const pictureRes = pictureStorage.get(id);
    if ("None" in pictureRes) {
      return Err({ NotFound: `picture with id=${id} not found` });
    }
    return Ok(pictureRes.Some);
  }),
  updatePicture: update(
    [UpdatePicturePayload],
    Result(Picture, Error),
    (payload) => {
      const pictureRes = pictureStorage.get(payload.id);
      if ("None" in pictureRes) {
        return Err({ NotFound: `picture with id=${payload.id} not found` });
      }
      const picture = pictureRes.Some;
      const updatePicture = {
        ...picture,
        ...payload,
      };
      pictureStorage.insert(picture.id, updatePicture);
      return Ok(updatePicture);
    }
  ),

  addUser: update([UserPayload], Result(User, Error), (payload) => {
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
      return Err({ NotFound: "invalid payload" });
    }
    const user = {
      id: uuidv4(),
      orders: [],
      ...payload,
    };
    userStorage.insert(user.id, user);
    return Ok(user);
  }),
  getUsers: query([], Vec(User), () => {
    return userStorage.values();
  }),
  getUser: query([text], Result(User, Error), (id) => {
    const userRes = userStorage.get(id);
    if ("None" in userRes) {
      return Err({ NotFound: `user with id=${id} not found` });
    }
    return Ok(userRes.Some);
  }),
  updateUser: update([UpdateUserPayload], Result(User, Error), (payload) => {
    const userRes = userStorage.get(payload.id);
    if ("None" in userRes) {
      return Err({ NotFound: `user with id=${payload.id} not found` });
    }
    const user = userRes.Some;
    const updatedUser = {
      ...user,
      ...payload,
    };
    userStorage.insert(user.id, updatedUser);
    return Ok(updatedUser);
  }),
  createOrder: update([OrderPayload], Result(OrderReturn, Error), (payload) => {
    const pictureRes = pictureStorage.get(payload.pictureId);
    const userRes = pictureStorage.get(payload.userId);

    if ("None" in userRes) {
      return Err({ NotFound: `user=${payload.userId} not found` });
    }
    if ("None" in pictureRes) {
      return Err({ NotFound: `picture=${payload.pictureId} not found` });
    }

    const picture = pictureRes.Some;
    const order = {
      id: uuidv4(),
      pictureId: picture.id,
      userId: payload.userId,
    };

    const returnOrder = {
      id: order.id,
      pictureId: picture.id,
      userId: payload.userId,
      username: userRes.Some.username,
    };

    const user = userRes.Some;
    const updatedUser = {
      ...user,
      pictures: user.pictures.concat(order.id),
    };
    return Ok(returnOrder);
  }),
});

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
