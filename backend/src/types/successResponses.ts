class SuccessResponse {
  message: string = 'OK';
  statusCode: string = '200';

  constructor(message: string, code: string) {
    this.message = message;
    this.statusCode = code;
  }
}

export default SuccessResponse;
