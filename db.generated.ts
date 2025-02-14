import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Messages {
  content: string;
  createdAt: Generated<Timestamp>;
  createdBy: string;
  modifyAt: Generated<Timestamp>;
  modifyBy: string;
  roomId: number;
  id: Generated<number>;
}

export interface Rooms {
  createdAt: Generated<Timestamp>;
  createdBy: string;
  modifyAt: Generated<Timestamp>;
  modifyBy: string;
  topic: string;
  id: Generated<number>;
}

export interface RoomsAllows {
  createdAt: Generated<Timestamp>;
  createdBy: string;
  key: string;
  roomId: number;
}

export interface RoomsBans {
  createdAt: Generated<Timestamp>;
  createdBy: string;
  key: string;
  roomId: number;
}

export interface Users {
  familyName: string;
  givenName: string;
  id: string;
}

export interface UsersRooms {
  roomId: number;
  seenAt: Generated<Timestamp>;
  userId: string;
}

export interface DB {
  messages: Messages;
  rooms: Rooms;
  roomsAllows: RoomsAllows;
  roomsBans: RoomsBans;
  users: Users;
  usersRooms: UsersRooms;
}
