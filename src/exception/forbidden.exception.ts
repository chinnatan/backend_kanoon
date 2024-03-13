export class ForbiddenException extends Error {
  message: string;
  status: number = 403;

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
