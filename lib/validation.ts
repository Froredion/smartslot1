/**
 * Validates an email address format
 * @param email The email address to validate
 * @returns boolean indicating if the email is valid
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password
 * @param password The password to validate
 * @returns boolean indicating if the password is valid
 */
export const validatePassword = (password: string): boolean => {
  // Password must be at least 6 characters long
  return password.length >= 6;
};

/**
 * Validates a username
 * @param username The username to validate
 * @returns boolean indicating if the username is valid
 */
export const validateUsername = (username: string): boolean => {
  // Username must be at least 3 characters long and only contain letters, numbers, and underscores
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}; 