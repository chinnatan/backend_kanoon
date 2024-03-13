export class UnauthorizeException extends Error {
  message: string;
  status: number = 401;

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
