export async function addUser(user) {
  return window.canister.userManager.addUser(user);
}

export async function updateUser(user) {
  return window.canister.userManager.updateUser(user);
}

export async function getUsers() {
  try {
    return await window.canister.userManager.getUsers();
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }

    return [];
  }
}

export async function getUser(userId) {
  try {
    return await window.canister.userManager.getUser(userId);
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }

    return [];
  }
}
