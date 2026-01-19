import EventEmitter from "events";

import type TypedEmitter from "typed-emitter";

export type TokenId = NonNullable<string>;

export type TokenReaderEvents = {
  update: () => void;
};

export abstract class TokenReader extends (EventEmitter as new () => TypedEmitter<TokenReaderEvents>) {
  protected constructor() {
    super();
  }

  public abstract get currentToken(): TokenId | null;
}
