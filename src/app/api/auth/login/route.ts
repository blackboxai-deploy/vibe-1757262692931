// Authentication API - Login endpoint
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/database';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Get client IP and user agent for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Authenticate user
    const result = await authenticateUser(email, password);

    if (!result) {
      // Log failed login attempt
      await createAuditLog({
        tenantId: '', // Will be empty for failed logins
        action: 'LOGIN_FAILED',
        resourceType: 'user',
        afterData: { email },
        ipAddress: clientIP,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { user, token } = result;

    // Log successful login
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'user',
      resourceId: user.id,
      afterData: { method: 'password' },
      ipAddress: clientIP,
      userAgent,
    });

    // Return user data and token
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name,
        permissions: user.role?.permissions,
      },
      token,
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}