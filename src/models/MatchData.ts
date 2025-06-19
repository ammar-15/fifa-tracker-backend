import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/db.js";

class MatchData extends Model {
  public id!: number;
  public createdAt!: Date;
  public email!: string;
  public uniqueid!:string;
  public username!: string; 
  public oppUsername!: string; 
  public team1!: string;
  public team1Goals!: string;
  public team2!: string;
  public team2Goals!: string;
  public timePlayed!: string;
  public stats!: object;
}

MatchData.init(
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uniqueid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    oppUsername: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    team1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    team1Goals: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    team2: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    team2Goals: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timePlayed: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stats: {
      type: DataTypes.JSONB, 
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "MatchData",
    tableName: "match_data",
    timestamps: true,
  }
);

export default MatchData;
