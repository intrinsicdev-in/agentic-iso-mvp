"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
class Artefact extends sequelize_1.Model {
}
Artefact.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('policy', 'procedure', 'work-instruction', 'form', 'record', 'iso-book'),
        allowNull: false,
    },
    clause: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    version: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: '1.0',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'pending_review', 'approved', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    ownerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    createdById: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    lastUpdatedById: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    // File upload fields
    fileName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    filePath: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    fileSize: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    fileType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    isoStandard: {
        type: sequelize_1.DataTypes.ENUM('ISO 9001:2015', 'ISO 27001:2022'),
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    tableName: 'artefacts',
});
// Associations
Artefact.belongsTo(User_1.default, { as: 'owner', foreignKey: 'ownerId' });
Artefact.belongsTo(User_1.default, { as: 'createdBy', foreignKey: 'createdById' });
Artefact.belongsTo(User_1.default, { as: 'lastUpdatedBy', foreignKey: 'lastUpdatedById' });
exports.default = Artefact;
