// Admin configuration - store hash securely
// This file should be in .gitignore in production

export const ADMIN_CONFIG = {
  email: "jonnyarley379@gmail.com",
  // Hash bcrypt da senha: mONETRa32&$56
  // Gerado com: await bcrypt.hash("mONETRa32&$56", 12)
  passwordHash: "$2b$12$MIcmmRG7PNs7HEAJImIoeOqWxX3aymFs.87vupI6wBn7TBsRyrFMi"
}
