import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
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
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireRole: (allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAccountAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireOrganizationScope: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateOrganizationOwnership: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
