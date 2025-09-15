// utils/clientId.ts
export function getClientId() {
  let clientId = localStorage.getItem("clientId");
  if (!clientId) {
    clientId = crypto.randomUUID(); // generates unique id
    localStorage.setItem("clientId", clientId);
  }
  return clientId;
}
