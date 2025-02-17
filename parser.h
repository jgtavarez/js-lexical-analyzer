#ifndef PARSER_H
#define PARSER_H

#include <stdio.h>

// Token types
typedef enum {
    TOKEN_EOF,
    TOKEN_KEYWORD,
    TOKEN_IDENTIFIER,
    TOKEN_STRING,
    TOKEN_NUMBER,
    TOKEN_OPERATOR,
    TOKEN_PUNCTUATION,
    TOKEN_BOOLEAN,
    TOKEN_NULL,
    TOKEN_UNDEFINED,
    TOKEN_COMMENT
} TokenType;

// Token structure
typedef struct {
    TokenType type;
    char* value;
    int line;
    int column;
} Token;

// Parser state
typedef struct {
    Token* current_token;
    Token* tokens;
    int token_index;
    int token_capacity;
    int error_count;
} Parser;

// Parser functions
Parser* create_parser(void);
void parse_program(Parser* parser);
void parse_statement(Parser* parser);
void parse_expression(Parser* parser);
void parse_function_declaration(Parser* parser);
void parse_variable_declaration(Parser* parser);
void parse_if_statement(Parser* parser);
void parse_while_statement(Parser* parser);
void parse_block(Parser* parser);

// Helper functions
void parser_error(Parser* parser, const char* message);
Token* peek_token(Parser* parser);
void advance_token(Parser* parser);
int match_token(Parser* parser, TokenType type);

#endif // PARSER_H 