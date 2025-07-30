import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AgentAttributes {
  id: number;
  name: string;
  type: 'risk_management' | 'policy_optimization' | 'audit_preparation' | 'training_compliance';
  description: string;
  status: 'active' | 'inactive' | 'maintenance';
  config: any;
  lastActivity?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AgentCreationAttributes extends Optional<AgentAttributes, 'id' | 'status' | 'config' | 'createdAt' | 'updatedAt'> {}

class Agent extends Model<AgentAttributes, AgentCreationAttributes> implements AgentAttributes {
  public id!: number;
  public name!: string;
  public type!: 'risk_management' | 'policy_optimization' | 'audit_preparation' | 'training_compliance';
  public description!: string;
  public status!: 'active' | 'inactive' | 'maintenance';
  public config!: any;
  public lastActivity?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Agent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('risk_management', 'policy_optimization', 'audit_preparation', 'training_compliance'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      allowNull: false,
      defaultValue: 'active',
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'agents',
  }
);

export default Agent; 