export class AuthError extends Error {
  constructor(m) {
    super(m);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(m) {
    super(m);
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class PasswordNotSetError extends AuthError {
  constructor(m) {
    super(m);
    Object.setPrototypeOf(this, PasswordNotSetError.prototype);
  }
}

export class ConnectionLoggedOutError extends Error {
  constructor(m) {
    super(m);
    Object.setPrototypeOf(this, ConnectionLoggedOutError.prototype);
  }
}

export class UnkownMessageTypeError extends Error {
  constructor(type) {
    super(`Unknown message type: ${type}`);
    Object.setPrototypeOf(this, UnkownMessageTypeError.prototype);
  }
}
