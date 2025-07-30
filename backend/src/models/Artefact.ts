import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export interface ArtefactAttributes {
  id: number;
  title: string;
  type: 'policy' | 'procedure' | 'work-instruction' | 'form' | 'record' | 'iso-book';
  clause: string;
  version: string;
  status: 'draft' | 'pending_review' | 'approved' | 'archived';
  content: string;
  ownerId: number;
  createdById: number;
  lastUpdatedById: number;
  // File upload fields
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  isoStandard?: 'ISO 9001:2015' | 'ISO 27001:2022';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ArtefactCreationAttributes extends Optional<ArtefactAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Artefact extends Model<ArtefactAttributes, ArtefactCreationAttributes> implements ArtefactAttributes {
  public id!: number;
  public title!: string;
  public type!: 'policy' | 'procedure' | 'work-instruction' | 'form' | 'record' | 'iso-book';
  public clause!: string;
  public version!: string;
  public status!: 'draft' | 'pending_review' | 'approved' | 'archived';
  public content!: string;
  public ownerId!: number;
  public createdById!: number;
  public lastUpdatedById!: number;
  public fileName?: string;
  public filePath?: string;
  public fileSize?: number;
  public fileType?: string;
  public isoStandard?: 'ISO 9001:2015' | 'ISO 27001:2022';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Artefact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('policy', 'procedure', 'work-instruction', 'form', 'record', 'iso-book'),
      allowNull: false,
    },
    clause: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '1.0',
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    lastUpdatedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    // File upload fields
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isoStandard: {
      type: DataTypes.ENUM('ISO 9001:2015', 'ISO 27001:2022'),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'artefacts',
  }
);

// Associations
Artefact.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
Artefact.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });
Artefact.belongsTo(User, { as: 'lastUpdatedBy', foreignKey: 'lastUpdatedById' });

export default Artefact; 