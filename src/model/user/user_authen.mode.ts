export class UserAuthen {
  id: number;
  username: string;
  fullname: string;
  password: string;
  storeId: number;
  storeName: string;

  constructor(
    id: number,
    username: string,
    fullname: string,
    password: string,
    storeId: number,
    storeName:string
  ) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.fullname = fullname;
    this.storeId = storeId;
    this.storeName = storeName;
  }
}
