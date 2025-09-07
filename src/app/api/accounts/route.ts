// Accounts API - CRUD operations
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, paginate, createAuditLog } from '@/lib/database';
import { getUserByToken } from '@/lib/auth';

const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  accountType: z.enum(['prospect', 'customer', 'partner']).default('prospect'),
  revenue: z.number().optional(),
  employeeCount: z.number().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  ownerId: z.string().optional(),
  parentAccountId: z.string().optional(),
  customFields: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
});

// Authentication middleware helper
async function authenticate(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const user = await getUserByToken(token);
  if (!user) {
    throw new Error('Invalid token');
  }
  
  return user;
}

// GET /api/accounts - List accounts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const accountType = searchParams.get('accountType') || '';
    const ownerId = searchParams.get('ownerId') || '';

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (industry) {
      where.industry = industry;
    }

    if (accountType) {
      where.accountType = accountType;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Get paginated results
    const result = await paginate(
      prisma.account,
      {
        page,
        limit,
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          contacts: {
            where: { isActive: true },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isPrimary: true,
            },
          },
          opportunities: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              amount: true,
              stage: {
                select: { name: true },
              },
            },
          },
          _count: {
            select: {
              contacts: true,
              opportunities: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      },
      user.tenantId
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('GET /api/accounts error:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const data = createAccountSchema.parse(body);

    // Create account
    const account = await prisma.account.create({
      data: {
        ...data,
        tenantId: user.tenantId,
        ownerId: data.ownerId || user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'account',
      resourceId: account.id,
      afterData: account,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(account, { status: 201 });

  } catch (error) {
    console.error('POST /api/accounts error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}