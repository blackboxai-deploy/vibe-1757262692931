// Authentication and authorization utilities
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface TokenPayload {
  userId: string;
  tenantId: string;
  roleId: string;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  tenantId: string;
  roleId: string | null;
  role: {
    id: string;
    name: string;
    permissions: any;
  } | null;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Authenticate user by email and password
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string } | null> {
  const user = await prisma.user.findFirst({
    where: {
      email,
      isActive: true,
    },
    include: {
      role: true,
      tenant: true,
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    tenantId: user.tenantId,
    roleId: user.roleId,
    role: user.role,
  };

  const tokenPayload: TokenPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    roleId: user.roleId || '',
    email: user.email,
  };

  const token = generateToken(tokenPayload);

  return { user: authUser, token };
}

// Get user by token
export async function getUserByToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = verifyToken(token);
    
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        tenantId: payload.tenantId,
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId,
      roleId: user.roleId,
      role: user.role,
    };
  } catch (error) {
    return null;
  }
}

// Role-based access control helpers
export interface Permission {
  resource: string;
  actions: string[];
}

export function hasPermission(
  userPermissions: any,
  resource: string,
  action: string
): boolean {
  if (!userPermissions) return false;

  // Super admin has all permissions
  if (userPermissions['*'] && userPermissions['*'].includes('*')) {
    return true;
  }

  // Check specific resource permissions
  const resourcePermissions = userPermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action) || resourcePermissions.includes('*');
}

// Check if user can access specific resource
export function canAccessResource(
  user: AuthUser,
  resource: string,
  action: string = 'read'
): boolean {
  if (!user.role) return false;
  return hasPermission(user.role.permissions, resource, action);
}

// Middleware types for API routes
export interface AuthenticatedRequest {
  user: AuthUser;
}

// Default permissions for system roles
export const DEFAULT_PERMISSIONS = {
  'Super Admin': { '*': ['*'] },
  'Admin': {
    users: ['read', 'write'],
    accounts: ['read', 'write'],
    contacts: ['read', 'write'],
    leads: ['read', 'write'],
    opportunities: ['read', 'write'],
    reports: ['read'],
    settings: ['read', 'write'],
  },
  'Sales Manager': {
    accounts: ['read', 'write'],
    contacts: ['read', 'write'],
    leads: ['read', 'write'],
    opportunities: ['read', 'write'],
    activities: ['read', 'write'],
    tasks: ['read', 'write'],
    reports: ['read'],
  },
  'Sales Rep': {
    accounts: ['read', 'write'],
    contacts: ['read', 'write'],
    leads: ['read', 'write'],
    opportunities: ['read', 'write'],
    activities: ['read', 'write'],
    tasks: ['read', 'write'],
  },
};

// Create default roles for a tenant
export async function createDefaultRoles(tenantId: string): Promise<void> {
  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access',
      permissions: DEFAULT_PERMISSIONS['Super Admin'],
      isSystemRole: true,
    },
    {
      name: 'Admin',
      description: 'Tenant administration',
      permissions: DEFAULT_PERMISSIONS['Admin'],
      isSystemRole: true,
    },
    {
      name: 'Sales Manager',
      description: 'Sales team management',
      permissions: DEFAULT_PERMISSIONS['Sales Manager'],
      isSystemRole: true,
    },
    {
      name: 'Sales Rep',
      description: 'Sales operations',
      permissions: DEFAULT_PERMISSIONS['Sales Rep'],
      isSystemRole: true,
    },
  ];

  for (const roleData of roles) {
    await prisma.role.create({
      data: {
        tenantId,
        ...roleData,
      },
    });
  }
}

// Password policy validation
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}