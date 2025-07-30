import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Use SQLite for development
const dbPath = path.join(process.cwd(), 'data', 'agentic_iso.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    // SQLite specific options
  }
});

export default sequelize; 