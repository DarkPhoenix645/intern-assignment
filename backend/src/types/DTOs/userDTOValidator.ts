import z from 'zod';

const nameLength = 1;
const minPassLength = 6;
const maxPassLength = 35;
const OTPLength = 6;

const stringMessage = 'Invalid string specified';
const emailMessage = 'Invalid email address specified';
const nameMessage = `Minimum name length is ${nameLength} characters`;
const minPasswordMessage = `Minimum password length is ${minPassLength} characters`;
const maxPasswordMessage = `Maximum password length is ${maxPassLength} characters`;
const otpLengthMessage = `The OTP must be exactly ${OTPLength} characters long`;
const otpMessage = 'The OTP must be alphanumeric';

const UserRegisterDTOValidator = z.object({
  name: z.string({ error: stringMessage }).min(nameLength, nameMessage),
  email: z.email({ error: emailMessage }).trim().toLowerCase(),
  password: z
    .string({ error: stringMessage })
    .min(minPassLength, minPasswordMessage)
    .max(maxPassLength, maxPasswordMessage),
});

const UserAuthDTOValidator = z.object({
  email: z.email({ error: emailMessage }).trim().toLowerCase(),
  password: z
    .string({ error: stringMessage })
    .min(minPassLength, minPasswordMessage)
    .max(maxPassLength, maxPasswordMessage),
});

const UserEmailDTOValidator = z.object({
  email: z.email({ error: emailMessage }).trim().toLowerCase(),
});

const UserOTPAuthDTOValidator = z.object({
  email: z.email({ error: emailMessage }).trim().toLowerCase(),
  otp: z
    .string({ error: stringMessage })
    .min(OTPLength, otpLengthMessage)
    .max(OTPLength, otpLengthMessage)
    .regex(/^[a-zA-Z0-9]+$/, { error: otpMessage }),
});

const UserResetPassDTOValidator = z.object({
  email: z.email({ error: emailMessage }).trim().toLowerCase(),
  otp: z.string({ error: stringMessage }).min(minPassLength, minPasswordMessage).max(maxPassLength, maxPasswordMessage),
  newPassword: z
    .string({ error: stringMessage })
    .min(minPassLength, minPasswordMessage)
    .max(maxPassLength, maxPasswordMessage),
});

export {
  UserRegisterDTOValidator,
  UserAuthDTOValidator,
  UserOTPAuthDTOValidator,
  UserEmailDTOValidator,
  UserResetPassDTOValidator,
};
