%{
#include <stdio.h>
#include <string.h>
#include "parser.h"

Token current_token;
int line_number = 1;
int column_number = 1;

void update_token(TokenType type, char* value) {
    current_token.type = type;
    current_token.value = strdup(value);
    current_token.line = line_number;
    current_token.column = column_number;
    column_number += strlen(value);
}

// Helper function to print token in the original format
void print_token(const char* type, const char* value) {
    printf("%s: %s\n", type, value);
}
%}

%%
[ \t]+                     { column_number += strlen(yytext); }
\n                        { line_number++; column_number = 1; }

"//".*                      { print_token("COMMENT", yytext); update_token(TOKEN_COMMENT, yytext); return TOKEN_COMMENT; }
[/][*][^*]*[*]+([^*/][^*]*[*]+)*[/] { print_token("COMMENT", yytext); update_token(TOKEN_COMMENT, yytext); return TOKEN_COMMENT; }

"function"                  { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"var"                      { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"let"                      { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"const"                    { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"if"                       { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"else"                     { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"for"                      { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"while"                    { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"do"                       { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"return"                   { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"break"                    { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"continue"                 { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"class"                    { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"async"                    { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"await"                    { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"import"                   { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"export"                   { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"try"                      { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"catch"                    { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"finally"                  { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"throw"                    { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"static"                   { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"super"                    { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"this"                     { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }
"new"                      { print_token("KEYWORD", yytext); update_token(TOKEN_KEYWORD, yytext); return TOKEN_KEYWORD; }

"true"|"false"             { print_token("BOOLEAN", yytext); update_token(TOKEN_BOOLEAN, yytext); return TOKEN_BOOLEAN; }
"null"|"undefined"         { print_token("LITERAL", yytext); update_token(TOKEN_NULL, yytext); return TOKEN_NULL; }

[0-9]+                     { print_token("INTEGER", yytext); update_token(TOKEN_NUMBER, yytext); return TOKEN_NUMBER; }
[0-9]*"."[0-9]+           { print_token("FLOAT", yytext); update_token(TOKEN_NUMBER, yytext); return TOKEN_NUMBER; }

\"([^\"\\]|\\.)*\"        { print_token("STRING", yytext); update_token(TOKEN_STRING, yytext); return TOKEN_STRING; }
\'([^\'\\]|\\.)*\'        { print_token("STRING", yytext); update_token(TOKEN_STRING, yytext); return TOKEN_STRING; }
`([^`\\]|\\.)*`           { print_token("TEMPLATE_STRING", yytext); update_token(TOKEN_STRING, yytext); return TOKEN_STRING; }

[+\-*/%=<>!&|^~]+         { print_token("OPERATOR", yytext); update_token(TOKEN_OPERATOR, yytext); return TOKEN_OPERATOR; }

[{}()\[\];,.]             { print_token("PUNCTUATION", yytext); update_token(TOKEN_PUNCTUATION, yytext); return TOKEN_PUNCTUATION; }

[a-zA-Z_$][a-zA-Z0-9_$]*  { print_token("IDENTIFIER", yytext); update_token(TOKEN_IDENTIFIER, yytext); return TOKEN_IDENTIFIER; }

.                         { printf("Error: Unexpected character '%s' at line %d, column %d\n", 
                                  yytext, line_number, column_number); }

%%

int yywrap() {
    return 1;
} 