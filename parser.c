#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "parser.h"

// Declare external variables from flex
extern Token current_token;
extern FILE* yyin;
extern int yylex(void);

// Token types

// Function declarations
void parse_program(Parser* parser);
void parse_statement(Parser* parser);
void parse_expression(Parser* parser);
void parse_function_declaration(Parser* parser);
void parse_variable_declaration(Parser* parser);
void parse_if_statement(Parser* parser);
void parse_while_statement(Parser* parser);
void parse_block(Parser* parser);

// Initialize parser
Parser* create_parser() {
    Parser* parser = (Parser*)malloc(sizeof(Parser));
    parser->tokens = NULL;
    parser->token_index = 0;
    parser->token_capacity = 0;
    parser->error_count = 0;
    return parser;
}

// Helper functions
void parser_error(Parser* parser, const char* message) {
    fprintf(stderr, "Syntax Error at line %d, column %d: %s\n",
            parser->current_token->line,
            parser->current_token->column,
            message);
    parser->error_count++;
}

Token* peek_token(Parser* parser) {
    if (parser->token_index >= parser->token_capacity) {
        return NULL;
    }
    return &parser->tokens[parser->token_index];
}

void advance_token(Parser* parser) {
    if (parser->token_index < parser->token_capacity) {
        parser->token_index++;
        parser->current_token = peek_token(parser);
    }
}

int match_token(Parser* parser, TokenType type) {
    if (parser->current_token && parser->current_token->type == type) {
        advance_token(parser);
        return 1;
    }
    return 0;
}

// Parsing functions
void parse_program(Parser* parser) {
    while (parser->current_token && parser->current_token->type != TOKEN_EOF) {
        parse_statement(parser);
    }
}

void parse_statement(Parser* parser) {
    Token* token = parser->current_token;
    
    if (!token) return;

    if (token->type == TOKEN_KEYWORD) {
        if (strcmp(token->value, "function") == 0) {
            parse_function_declaration(parser);
        }
        else if (strcmp(token->value, "var") == 0 ||
                 strcmp(token->value, "let") == 0 ||
                 strcmp(token->value, "const") == 0) {
            parse_variable_declaration(parser);
        }
        else if (strcmp(token->value, "if") == 0) {
            parse_if_statement(parser);
        }
        else if (strcmp(token->value, "while") == 0) {
            parse_while_statement(parser);
        }
        else {
            parser_error(parser, "Unexpected keyword");
            advance_token(parser);
        }
    }
    else {
        parse_expression(parser);
        if (!match_token(parser, TOKEN_PUNCTUATION)) { // expecting semicolon
            parser_error(parser, "Expected semicolon");
        }
    }
}

void parse_block(Parser* parser) {
    if (!match_token(parser, TOKEN_PUNCTUATION)) { // expecting {
        parser_error(parser, "Expected {");
        return;
    }

    while (parser->current_token && 
           !(parser->current_token->type == TOKEN_PUNCTUATION && 
             strcmp(parser->current_token->value, "}") == 0)) {
        parse_statement(parser);
    }

    if (!match_token(parser, TOKEN_PUNCTUATION)) { // expecting }
        parser_error(parser, "Expected }");
    }
}

void parse_expression(Parser* parser) {
    // Basic expression parsing
    if (parser->current_token) {
        switch (parser->current_token->type) {
            case TOKEN_IDENTIFIER:
            case TOKEN_NUMBER:
            case TOKEN_STRING:
            case TOKEN_BOOLEAN:
                advance_token(parser);
                break;
            default:
                parser_error(parser, "Expected expression");
                advance_token(parser);
        }
    }
}

void parse_function_declaration(Parser* parser) {
    // Parse 'function' keyword
    if (!match_token(parser, TOKEN_KEYWORD)) {
        parser_error(parser, "Expected 'function' keyword");
        return;
    }

    // Parse function name
    if (!match_token(parser, TOKEN_IDENTIFIER)) {
        parser_error(parser, "Expected function name");
        return;
    }

    // Parse parameter list
    if (!match_token(parser, TOKEN_PUNCTUATION)) { // expecting (
        parser_error(parser, "Expected '('");
        return;
    }

    // Parse parameters
    while (parser->current_token && 
           !(parser->current_token->type == TOKEN_PUNCTUATION && 
             strcmp(parser->current_token->value, ")") == 0)) {
        
        if (!match_token(parser, TOKEN_IDENTIFIER)) {
            parser_error(parser, "Expected parameter name");
            return;
        }

        // Check for comma if there are more parameters
        if (parser->current_token->type == TOKEN_PUNCTUATION && 
            strcmp(parser->current_token->value, ",") == 0) {
            advance_token(parser);
        }
    }

    if (!match_token(parser, TOKEN_PUNCTUATION)) { // expecting )
        parser_error(parser, "Expected ')'");
        return;
    }

    // Parse function body
    parse_block(parser);
}

void parse_variable_declaration(Parser* parser) {
    // Parse var/let/const keyword
    if (!match_token(parser, TOKEN_KEYWORD)) {
        parser_error(parser, "Expected variable declaration keyword");
        return;
    }

    // Parse variable name
    if (!match_token(parser, TOKEN_IDENTIFIER)) {
        parser_error(parser, "Expected variable name");
        return;
    }

    // Check for initialization
    if (parser->current_token && parser->current_token->type == TOKEN_OPERATOR &&
        strcmp(parser->current_token->value, "=") == 0) {
        advance_token(parser);
        parse_expression(parser);
    }

    // Expect semicolon
    if (!match_token(parser, TOKEN_PUNCTUATION)) {
        parser_error(parser, "Expected semicolon");
    }
}

void parse_if_statement(Parser* parser) {
    // Parse 'if' keyword
    if (!match_token(parser, TOKEN_KEYWORD)) {
        parser_error(parser, "Expected 'if' keyword");
        return;
    }

    // Parse condition
    if (!match_token(parser, TOKEN_PUNCTUATION)) { // expecting (
        parser_error(parser, "Expected '('");
        return;
    }

    parse_expression(parser);

    if (!match_token(parser, TOKEN_PUNCTUATION)) { // expecting )
        parser_error(parser, "Expected ')'");
        return;
    }

    // Parse if body
    parse_block(parser);

    // Parse optional else
    if (parser->current_token && parser->current_token->type == TOKEN_KEYWORD &&
        strcmp(parser->current_token->value, "else") == 0) {
        advance_token(parser);
        
        // Check if it's an else-if
        if (parser->current_token && parser->current_token->type == TOKEN_KEYWORD &&
            strcmp(parser->current_token->value, "if") == 0) {
            parse_if_statement(parser);
        } else {
            parse_block(parser);
        }
    }
}

void parse_while_statement(Parser* parser) {
    // Parse 'while' keyword
    if (!match_token(parser, TOKEN_KEYWORD)) {
        parser_error(parser, "Expected 'while' keyword");
        return;
    }

    // Parse condition
    if (!match_token(parser, TOKEN_PUNCTUATION)) { // expecting (
        parser_error(parser, "Expected '('");
        return;
    }

    parse_expression(parser);

    if (!match_token(parser, TOKEN_PUNCTUATION)) { // expecting )
        parser_error(parser, "Expected ')'");
        return;
    }

    // Parse while body
    parse_block(parser);
}

// Main function
int main(int argc, char **argv) {
    if (argc > 1) {
        if (!(yyin = fopen(argv[1], "r"))) {
            perror(argv[1]);
            return 1;
        }
    }

    Parser* parser = create_parser();
    
    // Initialize token array
    parser->token_capacity = 1000; // Initial capacity
    parser->tokens = (Token*)malloc(sizeof(Token) * parser->token_capacity);
    parser->token_index = 0;
    
    // Read all tokens from lexer
    int token_count = 0;
    int token_type;
    while ((token_type = yylex()) != 0) {
        // Resize token array if needed
        if (token_count >= parser->token_capacity) {
            parser->token_capacity *= 2;
            parser->tokens = (Token*)realloc(parser->tokens, 
                                           sizeof(Token) * parser->token_capacity);
        }
        
        // Store the token
        parser->tokens[token_count] = current_token;
        token_count++;
    }
    
    // Set current token to first token
    if (token_count > 0) {
        parser->current_token = &parser->tokens[0];
    }
    
    // Parse the program
    parse_program(parser);
    
    // Print parsing results
    printf("Parsing completed with %d errors\n", parser->error_count);
    
    // Cleanup
    for (int i = 0; i < token_count; i++) {
        free(parser->tokens[i].value);
    }
    free(parser->tokens);
    free(parser);
    
    if (yyin != stdin) {
        fclose(yyin);
    }
    
    return 0;
} 