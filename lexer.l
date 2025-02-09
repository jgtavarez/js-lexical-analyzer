%{
#include <stdio.h>
#include <string.h>
%}

%%
[ \t\n]+                    { /* Ignore whitespace */ }

"//".*                      { printf("COMMENT: %s\n", yytext); }
[/][*][^*]*[*]+([^*/][^*]*[*]+)*[/] { printf("MULTILINE_COMMENT: %s\n", yytext); }

"function"                  { printf("KEYWORD: %s\n", yytext); }
"var"                      { printf("KEYWORD: %s\n", yytext); }
"let"                      { printf("KEYWORD: %s\n", yytext); }
"const"                    { printf("KEYWORD: %s\n", yytext); }
"if"                       { printf("KEYWORD: %s\n", yytext); }
"else"                     { printf("KEYWORD: %s\n", yytext); }
"for"                      { printf("KEYWORD: %s\n", yytext); }
"while"                    { printf("KEYWORD: %s\n", yytext); }
"do"                       { printf("KEYWORD: %s\n", yytext); }
"return"                   { printf("KEYWORD: %s\n", yytext); }
"break"                    { printf("KEYWORD: %s\n", yytext); }
"continue"                 { printf("KEYWORD: %s\n", yytext); }
"class"                    { printf("KEYWORD: %s\n", yytext); }
"async"                    { printf("KEYWORD: %s\n", yytext); }
"await"                    { printf("KEYWORD: %s\n", yytext); }
"import"                   { printf("KEYWORD: %s\n", yytext); }
"export"                   { printf("KEYWORD: %s\n", yytext); }
"try"                      { printf("KEYWORD: %s\n", yytext); }
"catch"                    { printf("KEYWORD: %s\n", yytext); }
"finally"                  { printf("KEYWORD: %s\n", yytext); }
"throw"                    { printf("KEYWORD: %s\n", yytext); }
"static"                   { printf("KEYWORD: %s\n", yytext); }
"super"                    { printf("KEYWORD: %s\n", yytext); }
"this"                     { printf("KEYWORD: %s\n", yytext); }
"new"                      { printf("KEYWORD: %s\n", yytext); }

"true"|"false"             { printf("BOOLEAN: %s\n", yytext); }
"null"|"undefined"         { printf("LITERAL: %s\n", yytext); }

[0-9]+                     { printf("INTEGER: %s\n", yytext); }
[0-9]*"."[0-9]+           { printf("FLOAT: %s\n", yytext); }

\"([^\"\\]|\\.)*\"        { printf("STRING: %s\n", yytext); }
\'([^\'\\]|\\.)*\'        { printf("STRING: %s\n", yytext); }
`([^`\\]|\\.)*`           { printf("TEMPLATE_STRING: %s\n", yytext); }

"+"                        { printf("OPERATOR: %s\n", yytext); }
"-"                        { printf("OPERATOR: %s\n", yytext); }
"*"                        { printf("OPERATOR: %s\n", yytext); }
"/"                        { printf("OPERATOR: %s\n", yytext); }
"%"                        { printf("OPERATOR: %s\n", yytext); }
"**"                       { printf("OPERATOR: %s\n", yytext); }
"="                        { printf("OPERATOR: %s\n", yytext); }
"=="                       { printf("OPERATOR: %s\n", yytext); }
"==="                      { printf("OPERATOR: %s\n", yytext); }
"!="                       { printf("OPERATOR: %s\n", yytext); }
"!=="                      { printf("OPERATOR: %s\n", yytext); }
">"                        { printf("OPERATOR: %s\n", yytext); }
"<"                        { printf("OPERATOR: %s\n", yytext); }
">="                       { printf("OPERATOR: %s\n", yytext); }
"<="                       { printf("OPERATOR: %s\n", yytext); }
"++"                       { printf("OPERATOR: %s\n", yytext); }
"--"                       { printf("OPERATOR: %s\n", yytext); }
"&&"                       { printf("OPERATOR: %s\n", yytext); }
"||"                       { printf("OPERATOR: %s\n", yytext); }
"??"                       { printf("OPERATOR: %s\n", yytext); }
"!"                        { printf("OPERATOR: %s\n", yytext); }
"&"                        { printf("OPERATOR: %s\n", yytext); }
"|"                        { printf("OPERATOR: %s\n", yytext); }
"^"                        { printf("OPERATOR: %s\n", yytext); }
"~"                        { printf("OPERATOR: %s\n", yytext); }
"<<"                       { printf("OPERATOR: %s\n", yytext); }
">>"                       { printf("OPERATOR: %s\n", yytext); }
">>>"                      { printf("OPERATOR: %s\n", yytext); }
"+="                       { printf("OPERATOR: %s\n", yytext); }
"-="                       { printf("OPERATOR: %s\n", yytext); }
"*="                       { printf("OPERATOR: %s\n", yytext); }
"/="                       { printf("OPERATOR: %s\n", yytext); }
"%="                       { printf("OPERATOR: %s\n", yytext); }
"**="                      { printf("OPERATOR: %s\n", yytext); }
"??="                      { printf("OPERATOR: %s\n", yytext); }
"&&="                      { printf("OPERATOR: %s\n", yytext); }
"||="                      { printf("OPERATOR: %s\n", yytext); }
"=>"                       { printf("ARROW: %s\n", yytext); }

"{"                        { printf("PUNCTUATION: %s\n", yytext); }
"}"                        { printf("PUNCTUATION: %s\n", yytext); }
"("                        { printf("PUNCTUATION: %s\n", yytext); }
")"                        { printf("PUNCTUATION: %s\n", yytext); }
"["                        { printf("PUNCTUATION: %s\n", yytext); }
"]"                        { printf("PUNCTUATION: %s\n", yytext); }
";"                        { printf("PUNCTUATION: %s\n", yytext); }
","                        { printf("PUNCTUATION: %s\n", yytext); }
"."                        { printf("PUNCTUATION: %s\n", yytext); }
"..."                      { printf("SPREAD: %s\n", yytext); }
"?."                       { printf("OPTIONAL_CHAINING: %s\n", yytext); }

[a-zA-Z_$][a-zA-Z0-9_$]*  { printf("IDENTIFIER: %s\n", yytext); }

.                         { printf("UNKNOWN: %s\n", yytext); }

%%

int yywrap() {
    return 1;
}

int main(int argc, char **argv) {
    if (argc > 1) {
        if (!(yyin = fopen(argv[1], "r"))) {
            perror(argv[1]);
            return 1;
        }
    }
    yylex();
    return 0;
} 