export const ACTIVE_SHARED_KEY = 'daily-cross:active-shared:v1';
export const PLAYER_KEY = 'daily-cross:player:v1';
export const LOBBY_ID = /^[a-f0-9]{16}$/;
export const PLAYER_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function playerId(storage, uuid = () => crypto.randomUUID()) {
  const saved = storage.getItem(PLAYER_KEY);
  if (PLAYER_ID.test(saved || '')) return saved;
  const id = uuid(); storage.setItem(PLAYER_KEY, id); return id;
}
export function saveSharedSession(storage, session) { storage.setItem(ACTIVE_SHARED_KEY,JSON.stringify(session)); }
export function loadSharedSession(storage) {
  try {
    const value=JSON.parse(storage.getItem(ACTIVE_SHARED_KEY));
    if (!value || !/^[a-f0-9]{64}$/.test(value.token) || (value.lobby && !LOBBY_ID.test(value.lobby.id))) return null;
    return value;
  } catch { return null; }
}
export function clearSharedSession(storage) { storage.removeItem(ACTIVE_SHARED_KEY); }
export async function lobbyRequest(body, signal) {
  const response=await fetch('/api/lobbies',{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.any([AbortSignal.timeout(15000),...(signal?[signal]:[])]),...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();
  if(!response.ok){const error=new Error(data.error||'Could not open shared games.');error.status=response.status;throw error;}
  return data;
}
