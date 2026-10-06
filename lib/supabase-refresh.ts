type RefreshResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

export function isTokenExpiring(
  token: string,
  withinSeconds = 60
) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return true;
    }

    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const parsed = JSON.parse(
      atob(normalized)
    ) as {
      exp?: number;
    };

    if (!parsed.exp) {
      return true;
    }

    return (
      parsed.exp <=
      Math.floor(Date.now() / 1000) +
        withinSeconds
    );
  } catch {
    return true;
  }
}

export async function refreshSupabaseSession(
  refreshToken: string
) {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    "https://xtcrhaqjajritihqofsl.supabase.co";

  const apiKey =
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  const data =
    (await response.json()) as RefreshResponse;

  if (
    !data.access_token ||
    !data.refresh_token
  ) {
    return null;
  }

  return {
    accessToken:
      data.access_token,
    refreshToken:
      data.refresh_token,
    expiresIn:
      data.expires_in ?? 3600,
  };
}
