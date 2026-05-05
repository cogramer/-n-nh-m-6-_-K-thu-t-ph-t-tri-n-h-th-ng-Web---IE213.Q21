const INSECURE_PLACEHOLDER_VALUES = new Set([
  "default_secret_key",
  "default_refresh_secret_key",
  "your_secret_key",
  "replace_with_a_long_random_access_token_secret",
  "replace_with_a_long_random_refresh_token_secret",
  "replace_with_a_long_random_session_secret",
]);

export const getRequiredSecret = (name) => {
  const value = process.env[name]?.trim();

  if (!value || INSECURE_PLACEHOLDER_VALUES.has(value)) {
    throw new Error(
      `Missing secure ${name}. Set a long random value in backend/.env before starting the server.`
    );
  }

  return value;
};
