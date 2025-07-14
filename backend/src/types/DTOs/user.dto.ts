interface OTPAuthDTO {
  email: string;
  otp?: string;
}

interface AuthDTO {
  email: string;
  password: string;
}

interface RegisterDTO {
  name: string;
  email: string;
  phoneNumber: string;
}

interface ResetPassDTO {
  email: string;
  otp?: string;
  newPassword?: string;
}

export { OTPAuthDTO, AuthDTO, RegisterDTO, ResetPassDTO };
