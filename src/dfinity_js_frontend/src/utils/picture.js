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
  const sellerPrincipal = Principal.from(orderResponse.Ok.seller);
  const sellerAddress = await pictureCanister.getAddressFromPrincipal(
    sellerPrincipal
  );

  const block = await transferICP(
    sellerAddress,
    orderResponse.Ok.price,
    orderResponse.Ok.memo
  );
  await pictureCanister.completePurchase(
    sellerPrincipal,
    picture.id,
    orderResponse.Ok.Price,
    block,
    orderResponse.Ok.Memo
  );
}
