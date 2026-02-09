import EventEmitter from "events";

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

export type TokenState<TE extends TokenError<unknown, unknown>> =
  | { state: TokenStateType.ABSENT }
  | { state: TokenStateType.READING }
  | { state: TokenStateType.PRESENT; token: Token }
  | { state: TokenStateType.ERROR; error: TE };

export type TokenReaderEvents = {
  update: () => void;
};

export abstract class TokenReader<
  TS extends TokenState<TokenError<unknown, unknown>>,
> extends EventEmitter {
  protected constructor() {
    super();
  }

  public abstract get currentToken(): Readonly<TS>;

  // Type-safe event methods
  public override on(event: "update", listener: () => void): this {
    return super.on(event, listener);
  }

  public override emit(event: "update"): boolean {
    return super.emit(event);
  }
}
