export class MessageResponse {
  success: boolean;
  message: string | null = null;
  status: number | null = null;
  result: any;

  constructor({
    success,
    status = 200,
    result,
    message = null,
  }: {
    success: boolean;
    status?: number | null;
    result?: any;
    message?: string | null;
  }) {
    this.success = success;
    this.status = status;
    this.result = result;
    this.message = message;
  }
}
