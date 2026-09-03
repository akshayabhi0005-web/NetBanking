import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashValue(val: string): Promise<string> {
  return bcrypt.hash(val, SALT_ROUNDS);
}

export async function compareHash(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
