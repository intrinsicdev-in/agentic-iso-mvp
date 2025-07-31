"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrganizationOwnership = exports.requireOrganizationScope = exports.requireAccountAdmin = exports.requireSuperAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
        if (user.role !== client_1.UserRole.SUPER_ADMIN && user.organization && !user.organization.isActive) {
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
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
// Role-based authorization middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Super admin only middleware
exports.requireSuperAdmin = (0, exports.requireRole)([client_1.UserRole.SUPER_ADMIN]);
// Account admin or super admin middleware
exports.requireAccountAdmin = (0, exports.requireRole)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ACCOUNT_ADMIN]);
// Organization scope middleware - ensures user can only access their org's data
const requireOrganizationScope = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // Super admins can access any organization
    if (req.user.role === client_1.UserRole.SUPER_ADMIN) {
        return next();
    }
    // Other users must have an organization
    if (!req.user.organizationId) {
        return res.status(403).json({ error: 'No organization access' });
    }
    next();
};
exports.requireOrganizationScope = requireOrganizationScope;
// Organization ownership middleware - validates that resource belongs to user's org
const validateOrganizationOwnership = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // Super admins can access any organization's data
    if (req.user.role === client_1.UserRole.SUPER_ADMIN) {
        return next();
    }
    // Extract organization ID from request (could be in params, body, or query)
    const organizationId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
    if (organizationId && organizationId !== req.user.organizationId) {
        return res.status(403).json({ error: 'Access denied to this organization' });
    }
    next();
};
exports.validateOrganizationOwnership = validateOrganizationOwnership;
//# sourceMappingURL=auth.js.map