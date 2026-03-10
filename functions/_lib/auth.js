import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const encoder = new TextEncoder();

function getJwtSecret(env) {
  return env.JWT_SECRET || 'your-secret-key-change-in-production';
}

export function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password, hashed) {
  return bcrypt.compareSync(password, hashed);
}

export async function generateToken(user, env) {
  const payload = {
    userId: user._id,
    username: user.username,
    role: user.role,
    employeeId: user.employeeId || null,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(encoder.encode(getJwtSecret(env)));
}

export async function authenticateToken(request, env) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return { error: 'Access denied. No token provided.', status: 401 };
  }

  try {
    const { payload } = await jwtVerify(token, encoder.encode(getJwtSecret(env)));
    return { user: payload };
  } catch (error) {
    return { error: 'Invalid or expired token.', status: 403 };
  }
}

export function requireAdmin(user) {
  if (!user || user.role !== 'admin') {
    return { error: 'Access denied. Admin role required.', status: 403 };
  }
  return null;
}

