export class InvalidDataException extends Error {
  message: string;
  status: number = 400;

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
