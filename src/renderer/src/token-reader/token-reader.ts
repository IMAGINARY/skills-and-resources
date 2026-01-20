import EventEmitter from "events";

import type TypedEmitter from "typed-emitter";

export type TokenId = string;
export type TokenClass = string;
export type Token = { id: TokenId; class: TokenClass };

export type TokenReaderEvents = {
  update: () => void;
};

export abstract class TokenReader extends (EventEmitter as new () => TypedEmitter<TokenReaderEvents>) {
  protected constructor() {
    super();
  }

  public abstract get currentToken(): Readonly<Token> | null;
}
