// types.ts

export interface IMessage {
    _id: string;
    text: string;
    createdAt: Date;
    user: {
      _id: string;
      name?: string;
      avatar?: string;
    };
  }