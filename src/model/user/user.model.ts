export class User {
  id: number;
  username: string;
  fullname: string;
  token: string | undefined;
  refreshToken: string | undefined;
  exp: string | undefined;
  iat: string | undefined;
  storeId: number;
  storeName: string;

  constructor(id: number, username: string, fullname: string, storeId: number, storeName: string) {
    this.id = id;
    this.username = username;
    this.fullname = fullname;
    this.storeId = storeId;
    this.storeName = storeName;
  }
}
