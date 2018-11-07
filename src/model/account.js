import { MongoModel, string, number, shape } from 'phnq-lib';

class Account extends MongoModel {
  static schema = {
    email: string.isRequired,
    password: string,
    code: string,
    role: string,
    spotify: shape({ accessToken: string, refreshToken: string, expiry: number }),
  };

  static defaultValues = {
    password: null,
    code: null,
    role: 'user',
    spotify: { accessToken: null, refreshToken: null, expiry: 0 },
  };
}

export default Account;
