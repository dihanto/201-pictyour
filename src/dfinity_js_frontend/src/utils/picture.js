import { Principal } from "@dfinity/principal";
import { transferICP } from "./ledger";

export async function addPicture(picture) {
  return window.canister.picture.addPicture(picture);
}

export async function getPictures() {
  try {
    return await window.canister.picture.getPictures();
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }
    return [];
  }
}

export async function getPicture(pictureId) {
  try {
    return await window.canister.picture.getPicture(pictureId);
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }
    return [];
  }
}

export async function updatePicture(picture) {
  return window.canister.picture.updatePicture(picture);
}

export async function buyPicture(picture) {
  const pictureCanister = window.canister.picture;
  const orderResponse = await pictureCanister.createOrder(picture.id);
  const sellerPrincipal = Principal.from(orderResponse.Ok.payer);
  const sellerAddress = await pictureCanister.getAddressFromPrincipal(
    sellerPrincipal
  );

  const block = await transferICP(
    sellerAddress,
    orderResponse.Ok.amount,
    orderResponse.Ok.memo
  );
  console.log(
    pictureCanister,
    orderResponse,
    sellerPrincipal,
    sellerAddress,
    block
  );
  await pictureCanister.completeOrder(picture.id, block, orderResponse.Ok.memo);
}

export async function addUser(user) {
  return window.canister.picture.addUser(user);
}

export async function getUsers() {
  try {
    return await window.canister.picture.getUsers();
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }

    return [];
  }
}

export async function getUser(id) {
  try {
    return await window.canister.picture.getUser(id);
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }

    return [];
  }
}
