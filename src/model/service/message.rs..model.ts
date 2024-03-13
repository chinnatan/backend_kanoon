export class MessageResponse {
  success: boolean;
  message: string | null = null;
  result: any;

  constructor(success: boolean, result: any = undefined) {
    this.success = success;
    this.result = result;
  }
}
