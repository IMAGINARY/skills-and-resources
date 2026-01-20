import EventEmitter from "events";

import type TypedEmitter from "typed-emitter";

export type TokenId = string;
export type TokenClass = string;
export type Token = { id: TokenId; class: TokenClass };

export type TokenError<ErrorType, ErrorDetails> = {
  type: ErrorType;
  details: ErrorDetails;
};

export enum TokenStateType {
  ABSENT = "absent",
  READING = "reading",
  PRESENT = "present",
  ERROR = "error",
}

export type TokenState<TE extends TokenError<any, any>> =
  | { state: TokenStateType.ABSENT }
  | { state: TokenStateType.READING }
  | { state: TokenStateType.PRESENT; token: Token }
  | { state: TokenStateType.ERROR; error: TE };

export type TokenReaderEvents = {
  update: () => void;
};

export abstract class TokenReader<
  TS extends TokenState<any>,
> extends (EventEmitter as new () => TypedEmitter<TokenReaderEvents>) {
  protected constructor() {
    super();
  }

  public abstract get currentToken(): Readonly<TS>;
}
