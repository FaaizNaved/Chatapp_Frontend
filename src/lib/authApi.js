export async function apiRequest(path, options = {}) {
  const { headers: optHeaders, ...restOptions } = options;
  const response = await fetch(path, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(optHeaders || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function saveSession(session) {
  localStorage.setItem("chatapp_token", session.token);
  localStorage.setItem("chatapp_user", JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem("chatapp_token");
  localStorage.removeItem("chatapp_user");
}
