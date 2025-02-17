CC=gcc
CFLAGS=-Wall -Wextra

all: js_parser lexer

js_parser: lex.yy.c parser.c
	$(CC) $(CFLAGS) -o js_parser lex.yy.c parser.c

lex.yy.c: lexer.l
	flex lexer.l

lexer: js_parser
	ln -sf js_parser lexer

clean:
	rm -f js_parser lexer lex.yy.c *.o 