export class DataNotFoundException extends Error {
  message: string;
  status: number = 404;

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
