import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId?: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        organizationId?: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Fetch user from database to ensure they're still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Check if organization is active (except for SUPER_ADMIN)
    if (user.role !== UserRole.SUPER_ADMIN && user.organization && !user.organization.isActive) {
      return res.status(403).json({ error: 'Organization is inactive' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId || undefined
    };

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Super admin only middleware
export const requireSuperAdmin = requireRole([UserRole.SUPER_ADMIN]);

// Account admin or super admin middleware
export const requireAccountAdmin = requireRole([UserRole.SUPER_ADMIN, UserRole.ACCOUNT_ADMIN]);

// Organization scope middleware - ensures user can only access their org's data
export const requireOrganizationScope = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super admins can access any organization
  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  // Other users must have an organization
  if (!req.user.organizationId) {
    return res.status(403).json({ error: 'No organization access' });
  }

  next();
};

// Organization ownership middleware - validates that resource belongs to user's org
export const validateOrganizationOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super admins can access any organization's data
  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  // Extract organization ID from request (could be in params, body, or query)
  const organizationId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
  
  if (organizationId && organizationId !== req.user.organizationId) {
    return res.status(403).json({ error: 'Access denied to this organization' });
  }

  next();
};