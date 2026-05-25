declare module 'kuromoji' {
  export interface TokenizerBuilder {
    build(callback: (err: Error | null, tokenizer: any) => void): void;
  }

  export function builder(option: { dicPath: string }): TokenizerBuilder;

  export interface Token {
    word_id: number;
    word_type: string;
    word_position: number;
    surface_form: string;
    pos: string;
    pos_detail_1: string;
    pos_detail_2: string;
    pos_detail_3: string;
    conjugated_type: string;
    conjugated_form: string;
    basic_form: string;
    reading?: string;
    pronunciation?: string;
  }

  export interface Tokenizer {
    tokenize(text: string): Token[];
  }
}
