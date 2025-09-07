// Database configuration and utilities
import { PrismaClient } from '@prisma/client';

// Global database instance to prevent multiple connections in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/crm_dev',
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Multi-tenant query helper
export function withTenantFilter<T extends { tenantId: string }>(
  tenantId: string,
  baseQuery: any
): any {
  return {
    ...baseQuery,
    where: {
      ...baseQuery.where,
      tenantId,
    },
  };
}

// Soft delete helper
export async function softDelete(
  model: any,
  id: string,
  tenantId: string
): Promise<void> {
  await model.update({
    where: { id, tenantId },
    data: { isActive: false },
  });
}

// Pagination helper
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginate<T>(
  model: any,
  params: PaginationParams & { where?: any; include?: any; orderBy?: any },
  tenantId: string
): Promise<PaginatedResult<T>> {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  const where = {
    ...params.where,
    tenantId,
    isActive: true,
  };

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      include: params.include,
      orderBy: params.orderBy || { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Search helper for global search functionality
export async function globalSearch(
  tenantId: string,
  query: string,
  entities: string[] = ['accounts', 'contacts', 'leads', 'opportunities']
): Promise<any> {
  const results: any = {};

  if (entities.includes('accounts')) {
    results.accounts = await prisma.account.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { website: { contains: query, mode: 'insensitive' } },
          { industry: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        industry: true,
        owner: { select: { firstName: true, lastName: true } },
      },
    });
  }

  if (entities.includes('contacts')) {
    results.contacts = await prisma.contact.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        title: true,
        account: { select: { name: true } },
      },
    });
  }

  if (entities.includes('leads')) {
    results.leads = await prisma.lead.findMany({
      where: {
        tenantId,
        isConverted: false,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        status: true,
      },
    });
  }

  if (entities.includes('opportunities')) {
    results.opportunities = await prisma.opportunity.findMany({
      where: {
        tenantId,
        isActive: true,
        name: { contains: query, mode: 'insensitive' },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        amount: true,
        account: { select: { name: true } },
        stage: { select: { name: true } },
      },
    });
  }

  return results;
}

// Audit logging helper
export async function createAuditLog({
  tenantId,
  userId,
  action,
  resourceType,
  resourceId,
  beforeData,
  afterData,
  ipAddress,
  userAgent,
}: {
  tenantId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        resourceType,
        resourceId,
        beforeData: beforeData ? JSON.stringify(beforeData) : null,
        afterData: afterData ? JSON.stringify(afterData) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent disrupting main operations
  }
}

// Database cleanup for development
export async function cleanup(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    await prisma.$disconnect();
  }
}