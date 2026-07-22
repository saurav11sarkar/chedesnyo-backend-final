import { Types } from "mongoose";

export interface IConversation {
    members: Types.ObjectId[],
}