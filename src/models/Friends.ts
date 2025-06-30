import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/db.js";

class FriendsList extends Model {
  public from!: string;
  public to!: string;
  public status!: "pending" | "accepted" | "rejected";
}

FriendsList.init(
  {
    from: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    to: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "friendslist",
  }
);

export default FriendsList;
