"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Validation schemas
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8),
    organizationId: zod_1.z.string().optional()
});
const createOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional(),
    industry: zod_1.z.string().optional(),
    size: zod_1.z.string().optional(),
    adminEmail: zod_1.z.string().email(),
    adminName: zod_1.z.string().min(1),
    adminPassword: zod_1.z.string().min(8)
});
// Helper function to generate JWT token
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};
// Public routes
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                organization: true
            }
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check if organization is active (except for SUPER_ADMIN)
        if (user.role !== client_1.UserRole.SUPER_ADMIN && user.organization && !user.organization.isActive) {
            return res.status(403).json({ error: 'Organization is inactive' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(user.id);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
                organization: user.organization ? {
                    id: user.organization.id,
                    name: user.organization.name,
                    slug: user.organization.slug
                } : null
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Login failed' });
    }
});
// Super admin only: Create new organization with admin user
router.post('/organizations', auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const data = createOrganizationSchema.parse(req.body);
        // Check if organization slug is unique
        const existingOrg = await prisma.organization.findUnique({
            where: { slug: data.slug }
        });
        if (existingOrg) {
            return res.status(400).json({ error: 'Organization slug already exists' });
        }
        // Check if admin email is unique
        const existingUser = await prisma.user.findUnique({
            where: { email: data.adminEmail }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Admin email already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.adminPassword, 10);
        // Create organization with admin user and default settings
        const result = await prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    website: data.website,
                    industry: data.industry,
                    size: data.size
                }
            });
            await tx.organizationSettings.create({
                data: {
                    organizationId: organization.id,
                    enabledStandards: ['ISO_9001_2015', 'ISO_27001_2022']
                }
            });
            const admin = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    name: data.adminName,
                    password: hashedPassword,
                    role: client_1.UserRole.ACCOUNT_ADMIN,
                    organizationId: organization.id
                }
            });
            return { organization, admin };
        });
        res.status(201).json({
            organization: result.organization,
            admin: {
                id: result.admin.id,
                email: result.admin.email,
                name: result.admin.name,
                role: result.admin.role
            }
        });
    }
    catch (error) {
        console.error('Create organization error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create organization' });
    }
});
// Account admin only: Create new user within their organization
router.post('/users', auth_1.authenticateToken, auth_1.requireAccountAdmin, async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        // Account admins can only create users in their own organization
        const organizationId = req.user.role === client_1.UserRole.SUPER_ADMIN
            ? data.organizationId
            : req.user.organizationId;
        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID required' });
        }
        // Check if email is unique
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                password: hashedPassword,
                role: client_1.UserRole.USER,
                organizationId
            },
            include: {
                organization: true
            }
        });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
                organization: user.organization
            }
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});
// Get current user profile
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                organization: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
                organization: user.organization,
                lastLogin: user.lastLogin,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});
// Get users (filtered by organization for non-super-admins)
router.get('/users', auth_1.authenticateToken, auth_1.requireAccountAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        // Super admins can see all users, account admins only see their org users
        if (req.user.role !== client_1.UserRole.SUPER_ADMIN) {
            where.organizationId = req.user.organizationId;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                include: {
                    organization: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);
        res.json({
            users: users.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.isActive,
                organizationId: user.organizationId,
                organization: user.organization,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});
// Toggle user active status
router.put('/users/:userId/toggle-active', auth_1.authenticateToken, auth_1.requireAccountAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check permissions
        if (req.user.role !== client_1.UserRole.SUPER_ADMIN && user.organizationId !== req.user.organizationId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Can't deactivate yourself
        if (user.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot deactivate yourself' });
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive }
        });
        res.json({
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                isActive: updatedUser.isActive
            }
        });
    }
    catch (error) {
        console.error('Toggle user active error:', error);
        res.status(500).json({ error: 'Failed to toggle user status' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map