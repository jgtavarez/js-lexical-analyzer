CC=gcc
CFLAGS=-Wall -Wextra

all: js_parser

js_parser: lex.yy.c parser.c
	$(CC) $(CFLAGS) -o js_parser lex.yy.c parser.c

lex.yy.c: lexer.l
	flex lexer.l

clean:
	rm -f js_parser lex.yy.c *.o 