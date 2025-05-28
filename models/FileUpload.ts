import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/db.js";

class FileUpload extends Model {
  public id!: number;
  public filename!: string;
  public path!: string;
  public mimetype!: string;
  public size!: number;
  public userId!: string;
}

FileUpload.init(
  {
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: "FileUpload",
    tableName: "file_uploads",
  }
);

export default FileUpload;
