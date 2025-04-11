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
 * Checks if a string looks like an email address
 * @param str The string to check
 * @returns boolean indicating if the string looks like an email
 */
export const looksLikeEmail = (str: string): boolean => {
  // Simple email pattern check - contains @ and a dot after @
  return /^[^@]+@[^@]+\.[^@]+$/.test(str);
};

/**
 * Validates a username
 * @param username The username to validate
 * @returns boolean indicating if the username is valid
 */
export const validateUsername = (username: string): boolean => {
  // Username must be at least 3 characters long and only contain letters, numbers, and underscores
  // Also prevent usernames that look like emails
  return username.length >= 3 && 
         /^[a-zA-Z0-9_]+$/.test(username) && 
         !looksLikeEmail(username);
}; 