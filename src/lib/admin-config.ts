// Admin configuration - store hash securely
// This file should be in .gitignore in production

export const ADMIN_CONFIG = {
  email: "jonnyarley379@gmail.com",
  // Hash bcrypt da senha: cORVo32&$56
  // Gerado com: await bcrypt.hash("cORVo32&$56", 12)
  passwordHash: "$2b$12$kNRbxCWE3JPQs3hn9KCVverMGcwJv0UqMUJPgyh3NMoxySBSHTeUu"
}
