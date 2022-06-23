javaSyntax = {
	/** Объект содержит информацию о типах символов и методы для работы с ними */
	char: {
		/** Получить объект типа символа
		 * @param {string} c - Проверяемый символ
		 * @return {object} Объект тип символа (char.type)
		*/
		getType(c) {
			var types = this.type;
			for (type in types)
				if (this.isThis(c, types[type]))
					return types[type];
			return types.UNDEFINED;
		},
		/** Является ли символ представителем предполагаемого типа
		 * @param {string} c - Проверяемый символ
		 * @param {string} type - Предполагаемый тип
		 * @return {boolean} Результат проверки
		*/
		isThis(c, type) {
			if (type.isInterval != null) {
				var intervals = type.isInterval;
				var length = intervals.length;
				for (var i = 0; i < length; i++)
					if (c.charCodeAt(0) >= intervals[i][0] && c.charCodeAt(0) <= intervals[i][1])
						return true;
			}
			if (type.isArr != null) {
				var arr = type.isArr;
				var length = arr.length;
				for (var i = 0; i < length; i++)
					if (c == arr[i])
						return true;
			}
			return false;
		},
		/* Типы символов
		 * @property {object} <TYPE> - Объект тип символа
		 * @property {number[][]} <TYPE>.isInterval - Массив интервалов кодов символов, определяющих данный тип
		 * @property {string[]} <TYPE>.isArr - Массив символов определяющих данный тип
		 * @property {object} <TYPE>.<SUB_TYPE> - Объект тип символа (подтипы), внутренняя структура та же
		*/
		type: {
			LETTER: {/* Буквы латиницы + '_' */
				isInterval: [[65, 90], [97, 122]],
				isArr: ['_'],
				LITERAL_LETTER: {/* Буквы используемые в литералах */
					isArr: ['X', 'x', 'B', 'b', 'D', 'd', 'F', 'f', 'L', 'l', 'E', 'e']
				}
			},
			NUM: {/* Цифры десятичные */
				isInterval: [[48, 57]],
				BIN: {/* Цифры двоичные */
					isArr: ['0', '1']
				},
				OCT: {/* Цифры 8-е */
					isInterval: [[48, 55]]
				},
				HEX: {/* 16-е */
					isInterval: [[48, 57], [97, 102], [65, 70]]
				},
			},
			DOT: {/* Сиивол точки */
				isArr: ['.']
			},
			LINE: {/* Символ перевода строки */
				isArr: ['\n']
			},
			SEPARATOR: {/* Разделители */
				isArr: [' ', '\t', ';', '{', '}', '[', ']', '(', ')']
			},
			SYMBOL: {/* Используемые в операторах символы */
				isArr: ['>', '<', '=', '+', '-', '/', '!', '&', '|', '*', '%', '$', '^', '~', ':', '?']
			},
			QUOTES: {/* Используемые кавычки */
				isArr: ['"']
			},
			UNDEFINED: {}/* Все остальные символы */
		}
	},
	/** Объект содержит информацию о видах лексем и методы для работы с ними */
	lex: {
		/** Формирует объект лексемы, и добавляет его в массив
		 * @param {object[]} list - Массив, в который добавляется сформированый объект лексемы
		 * @param {object} state - Состояние лексемы
		 * @param {string} text - Текст лексемы
		 * @param {boolean} [check = false] - Необходимо ли перед добавлением лексемы осуществлять проверку ее
		 		соответствия своему состоянию, при значении true, функция возвозвращает результат проверки
		 * @return {null|boolean} - Функция возвращает результат проверки лексемы на соответствие, если такая проверка
		 		производится (check = true)
		 */
		addLex(list, state, text, check = false) {
			if (! check)
				list.push({text: text, state: state});
			else
				if (this.isThis(text, state)) {
					list.push({text: text, state: state});
					return true;
				} else
					return false;
		},
		/** Является ли текст - лексемой предполагаемого состояния
		 * @param {string} text - Проверяемый текст
		 * @param {string} state - Предполагаемое состояние
		 * @return {boolean} Результат проверки
		*/
		isThis(text, state) {
			if (state.isArr != null) {
				var arr = state.isArr;
				var length = arr.length;
				for (var i = 0; i < length; i++)
					if (text == arr[i])
						return true;
			}
			return false;
		},
		/* Состояния лексем
		 * @property {object} <STATE> - Объект состояния лексемы
		 * @property {string} <STATE>.style - Ссылка на css стиль, которым выделяется это состояние лексем
		 * @property {string[]} <TYPE>.isArr - Массив лексем определяющих данное состояние
		*/
		state: {
			EMPTY: {},
			OPERATOR: {
				style: 'spanOperator',
				isArr: ['=', '+', '-', '*', '/', '++', '--', '!', '==', '!=', '>', '<', '>=', '<=', '&&', '||',
				'+=', '-=', '*=', '/=', '%=', '$=', '^=', '|=', ',', '%', '&', '|', '^', '~', ':', '?', '>>', '<<',
				'>>>', '<<=', '>>=']
			},
			DOT: {},
			WORD: {},
			LITERAL: {
				style: 'spanLiteral',
				isArr: ['true', 'false', 'null']
			},
			STRING: {
				style: 'spanString'
			},
			COMMENT_INLINE: {
				style: 'spanComment'
			},
			COMMENT_BLOCK: {
				style: 'spanComment'
			},
			KEYWORD: {
				style: 'spanKeyword',
				isArr: ['if', 'switch', 'case', 'default', 'break', 'continue', 'for', 'while', 'do', 'void',
					'class', 'public', 'private', 'static', 'final', 'String', 'int', 'boolean', 'float', 'double']
			},
			IDENTIFIER: {
				style: 'spanIdentifiers'
			},
			SEPARATOR: {
				style: 'spanSeparator',
				isArr: [' ', '\t', ';', '{', '}', '[', ']', '(', ')']
			},
			ERROR: {
				style: 'spanError'
			},
			WARNING: {
				style: 'spanWarning'
			},
			LINE: {}
		},
		/* Тип состояния лексем (пока что только числа):
		 * @property UNDEFINED - Не определен
		 * @property NUM_N - Цифры без символов
		 * @property NUM_D - Цифры с точкой на конце
		 * @property NUM_D_N - Цифры+точка+цифры
		 * @property NUM_E - Цифры+буква Е (экспонента)
		 * @property NUM_E_S - Цифры+Е+знак(+ или -)
		 * @property NUM_E_N - Цифры+Е(со знаком или без)+цифры
		 * @property NUM_HEX - Hex число (начинается с 0х)
		 * @property NUM_BIN - Bin число (0b)
		 * @property NUM_OCT - Oct число (0)
		*/
		stateType: {
			UNDEFINED: 0,
			NUM_N: 1,
			NUM_D: 2,
			NUM_D_N: 3,
			NUM_E: 4,
			NUM_E_S: 5,
			NUM_E_N: 6,
			NUM_HEX: 7,
			NUM_BIN: 8,
			NUM_OCT: 9
		}
	},
	/** Функция посимвольно разбирает текст, и возвращает массив объектов - лексем
	 * @param {string} text - Разбираемый текст
	 * @return {object[]} - Возвращает массив объектов [{text, state}], где text - текст лексемы,
			state - состояние лексемы
	*/
	parseText(text) {
		var lex = this.lex;
		var lexState = lex.state;
		var lexType = lex.state;
		var char = this.char;
		var charType = char.type;

		var res = [];
		var buf = '';
		var type = lexType.UNDEFINED;
		var state = lexState.EMPTY;

		var length = text.length;
		for (var i = 0; i < length; i++) {
			var c = text.charAt(i);
			if (c == '\r')
				continue;
			switch (char.getType(c)) {
				case charType.LINE:
					switch (state) {
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
						case lexState.STRING:
							lex.addLex(res, state, buf);
							break;
						case lexState.OPERATOR:
							if (! lex.addLex(res, lexState.OPERATOR, buf, true))
								lex.addLex(res, lexState.ERROR, buf);
							break;
						case lexState.DOT:
							lex.addLex(res, lexState.SEPARATOR, buf);
							break;
						case lexState.WORD:
							if (! lex.addLex(res, lexState.KEYWORD, buf, true))
								if (! lex.addLex(res, lexState.LITERAL, buf, true))
									lex.addLex(res, lexState.IDENTIFIER, buf);
							break;
						case lexState.LITERAL:
							lex.addLex(res, lexState.LITERAL, buf);
							break;
						case lexState.ERROR:
							lex.addLex(res, lexState.ERROR, buf);
							containsErrors = true;
							break;
					}
					lex.addLex(res, lexState.LINE, null);
					buf = '';
					state = lexState.EMPTY;
					break;
				case charType.SEPARATOR:
					if (	state == lexState.STRING ||
							state == lexState.COMMENT_INLINE ||
							state == lexState.COMMENT_BLOCK) {
						buf += c;
						break;
					}
					switch (state) {
						//case lexState.EMPTY: break;
						case lexState.OPERATOR:
							if (! lex.addLex(res, lexState.OPERATOR, buf, true))
								lex.addLex(res, lexState.ERROR, buf);
							break;
						case lexState.DOT:
							lex.addLex(res, lexState.SEPARATOR, buf);
							break;
						case lexState.WORD:
							if (! lex.addLex(res, lexState.KEYWORD, buf, true))
								if (! lex.addLex(res, lexState.LITERAL, buf, true))
									lex.addLex(res, lexState.IDENTIFIER, buf);
							break;
						case lexState.LITERAL:
							lex.addLex(res, lexState.LITERAL, buf);
							break;
						case lexState.ERROR:
							lex.addLex(res, lexState.ERROR, buf);
							break;
					}
					lex.addLex(res, lexState.SEPARATOR, c);
					buf = '';
					state = lexState.EMPTY;
					break;
				case charType.QUOTES:
					if (state == lexState.COMMENT_INLINE || state == lexState.COMMENT_BLOCK) {
						buf += c;
						break;
					}
					if (state == lexState.STRING) {
						buf += c;
						lex.addLex(res, lexState.STRING, buf);
						buf = '';
						state = lexState.EMPTY;
						break;
					}
					switch (state) {
						//case lexState.EMPTY:break;
						case lexState.OPERATOR:
							if (! lex.addLex(res, lexState.OPERATOR, buf, true))
								lex.addLex(res, lexState.ERROR, buf);
							break;
						case lexState.DOT:
							lex.addLex(res, lexState.SEPARATOR, buf);
							break;
						case lexState.WORD:
							if (! lex.addLex(res, lexState.KEYWORD, buf, true))
								if (! lex.addLex(res, lexState.LITERAL, buf, true))
									lex.addLex(res, lexState.IDENTIFIER, buf);
							break;
						case lexState.LITERAL:
							lex.addLex(res, lexState.LITERAL, buf);
							break;
						case lexState.ERROR:
							lex.addLex(res, lexState.ERROR, buf);
							break;
					}
					buf = c;
					state = lexState.STRING;
					break;
				case charType.SYMBOL:
					switch (state) {
						case lexState.STRING:
						case lexState.COMMENT_INLINE:
							buf += c;
							break;
						case lexState.COMMENT_BLOCK:
							buf += c;
							if (buf[buf.length-2] == '*' && buf[buf.length-1] == '/') {
								lex.addLex(res, lexState.COMMENT_BLOCK, buf);
								buf = '';
								state = lexState.EMPTY;
							}
							break;
						case lexState.EMPTY:
						case lexState.OPERATOR:
							buf += c;
							if (buf[buf.length-2]  == '/' && buf[buf.length-1] == '/') {
								state = lexState.COMMENT_INLINE;
							} else {
								if (buf[buf.length-2] == '/' && buf[buf.length-1] == '*') {
									state = lexState.COMMENT_BLOCK;
								} else {
									state = lexState.OPERATOR;
								}
							}
							break;
						case lexState.DOT:
							lex.addLex(res, lexState.SEPARATOR, buf);
							buf = c;
							state = lexState.OPERATOR;
							break;
						case lexState.WORD:
							if (! lex.addLex(res, lexState.KEYWORD, buf, true))
								if (! lex.addLex(res, lexState.LITERAL, buf, true))
									lex.addLex(res, lexState.IDENTIFIER, buf);
							buf = c;
							state = lexState.OPERATOR;
							break;
						case lexState.LITERAL:
							if (type == lexType.NUM_E && (c == '+' || c == '-')) {
								buf += c;
								type = lexType.NUM_E_S;
							} else {
								lex.addLex(res, lexState.LITERAL, buf);
								buf = c;
								state = lexState.OPERATOR;
							}
							break;
						case lexState.ERROR:
							lex.addLex(res, lexState.ERROR, buf);
							buf = c;
							state = lexState.OPERATOR;
							break;
					}
					break;
				case charType.DOT:
					switch (state) {
						case lexState.STRING:
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
							buf += c;
							break;
						case lexState.EMPTY:
							buf += c;
							state = lexState.DOT;
							break;
						case lexState.OPERATOR:
							if (! lex.addLex(res, lexState.OPERATOR, buf, true))
								lex.addLex(res, lexState.ERROR, buf);
							buf = c;
							state = lexState.DOT;
							break;
						case lexState.DOT:
							lex.addLex(res, lexState.SEPARATOR, buf);
							buf = c;
							state = lexState.DOT;
							break;
						case lexState.WORD:
							if (! lex.addLex(res, lexState.KEYWORD, buf, true))
								if (! lex.addLex(res, lexState.LITERAL, buf, true))
									lex.addLex(res, lexState.IDENTIFIER, buf);
							buf = c;
							state = lexState.DOT;
							break;
						case lexState.LITERAL:
							if (type == lexType.NUM_N) {
								buf += c;
								type = lexType.NUM_D;
							} else {
								lex.addLex(res, lexState.LITERAL, buf);
								buf = c;
								state = lexState.DOT;
							}
							break;
						case lexState.ERROR:
							lex.addLex(res, lexState.ERROR, buf);
							buf = c;
							state = lexState.DOT;
							break;
					}
					break;
				case charType.LETTER:
					switch (state) {
						case lexState.STRING:
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
							buf += c;
							break;
						case lexState.EMPTY:
							buf += c;
							state = lexState.WORD;
							break;
						case lexState.OPERATOR:
							if (! lex.addLex(res, lexState.OPERATOR, buf, true))
								lex.addLex(res, lexState.ERROR, buf);
							buf = c;
							state = lexState.WORD;
							break;
						case lexState.DOT:
							lex.addLex(res, lexState.SEPARATOR, buf);
							buf = c;
							state = lexState.WORD;
							break;
						case lexState.WORD:
							buf += c;
							break;
						case lexState.LITERAL:
							if (type == lexType.NUM_HEX && char.isThis(c, charType.NUM.HEX))
								buf += c;
							else {
								if (char.isThis(c, charType.LETTER.LITERAL_LETTER)) {
									var correct = true;
									switch (c) {
										case 'L':
										case 'l':
											if (type == lexType.NUM_N || type == lexType.NUM_HEX) {
												buf += c;
												lex.addLex(res, lexState.LITERAL, buf);
												buf = '';
												state = lexState.EMPTY;
											} else
												correct = false;
											break;
										case 'E':
										case 'e':
											if (type == lexType.NUM_N || type == lexType.NUM_D_N) {
												type = lexType.NUM_E;
												buf += c;
											} else
												correct = false;
											break;
										case 'X':
										case 'x':
											if (buf[0] == '0' && buf.length == 1) {
												type = lexType.NUM_HEX;
												buf += c;
											} else
												correct = false;
											break;
										case 'B':
										case 'b':
											if (buf[0] == '0' && buf.length == 1) {
												type = lexType.NUM_BIN;
												buf += c;
											} else
												correct = false;
											break;
										case 'D':
										case 'd':
										case 'F':
										case 'f':
											if (type == lexType.NUM_D_N || type == lexType.NUM_E_N) {
												buf += c;
												lex.addLex(res, lexState.LITERAL, buf);
												buf = '';
												state = lexState.EMPTY;
											} else
												correct = false;
											break;
									}
									if (!correct) {
										lex.addLex(res, lexState.LITERAL, buf);
										buf = c;
										state = lexState.WORD;
									}
								} else {
									lex.addLex(res, lexState.LITERAL, buf);
									buf = c;
									state = lexState.WORD;
								}
							}
							break;
						case lexState.ERROR:
							lex.addLex(res, lexState.ERROR, buf);
							buf = c;
							state = lexState.WORD;
							break;
					}
					break;
				case charType.NUM:
					switch (state) {
						case lexState.STRING:
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
							buf += c;
							break;
						case lexState.EMPTY:
							buf += c;
							state = lexState.LITERAL;
							type = lexType.NUM_N;
							break;
						case lexState.OPERATOR:
							if (! lex.addLex(res, lexState.OPERATOR, buf, true))
								lex.addLex(res, lexState.ERROR, buf);
							buf = c;
							state = lexState.LITERAL;
							type = lexType.NUM_N;
							break;
						case lexState.DOT:
							buf += c;
							state = lexState.LITERAL;
							type = lexType.NUM_N;
							break;
						case lexState.WORD:
							buf += c;
							state = lexState.WORD;
							break;
						case lexState.LITERAL:
							switch (type) {
								case lexType.NUM_D:
									type = lexType.NUM_D_N;
									buf += c;
									break;
								case lexType.NUM_N:
									buf += c;
									if (buf.length == 1 && buf[0] == '0') {
										type = lexType.NUM_OCT;
										if (!char.isThis(c, charType.NUM.OCT)) {
											lex.addLex(res, lexState.ERROR, buf);
											buf = '';
											state = lexState.EMPTY;
										}
									}
									break;
								case lexType.NUM_D_N:
								case lexType.NUM_HEX:
								case lexType.NUM_E_N:
									buf += c;
									break;
								case lexType.NUM_BIN:
									buf += c;
									if (!char.isThis(c, charType.NUM.BIN)) {
										lex.addLex(res, lexState.ERROR, buf);
										buf = '';
										state = lexState.EMPTY;
									}
									break;
								case lexType.NUM_OCT:
									buf += c;
									if (!char.isThis(c, charType.NUM.OCT)) {
										lex.addLex(res, lexState.ERROR, buf);
										buf = '';
										state = lexState.EMPTY;
									}
									break;
								case lexType.NUM_E:
								case lexType.NUM_E_S:
									type = lexType.NUM_E_N;
									buf += c;
									break;
							}
							break;
						case lexState.ERROR:
							lex.addLex(res, lexState.ERROR, buf);
							buf = c;
							state = lexState.LITERAL;
							type = lexType.NUM_N;
							break;
					}
					break;
				case charType.UNDEFINED:
					switch (state) {
						case lexState.STRING:
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
							buf += c;
							break;
						case lexState.EMPTY:
							buf += c;
							state = lexState.ERROR;
							break;
						case lexState.OPERATOR:
							if (! lex.addLex(res, lexState.OPERATOR, buf, true))
								lex.addLex(res, lexState.ERROR, buf);
							buf = c;
							lex.addLex(res, lexState.ERROR, buf);
							buf = '';
							state = lexState.EMPTY;
							break;
						case lexState.DOT:
							lex.addLex(res, lexState.SEPARATOR, buf);
							buf = c;
							lex.addLex(res, lexState.ERROR, buf);
							buf = '';
							state = lexState.EMPTY;
							break;
						case lexState.WORD:
							if (! lex.addLex(res, lexState.KEYWORD, buf, true))
								if (! lex.addLex(res, lexState.LITERAL, buf, true))
									lex.addLex(res, lexState.IDENTIFIER, buf);
							buf = c;
							lex.addLex(res, lexState.ERROR, buf);
							buf = '';
							state = lexState.EMPTY;
							break;
						case lexState.LITERAL:
							lex.addLex(res, lexState.LITERAL, buf);
							buf = c;
							lex.addLex(res, lexState.ERROR, buf);
							buf = '';
							state = lexState.EMPTY;
							break;
						case lexState.ERROR:
							buf += c;
							break;
					}
					break;
			}

			if (i == text.length-1 && buf.length > 0) {
				switch (state) {
					case lexState.COMMENT_INLINE:
					case lexState.COMMENT_BLOCK:
						lex.addLex(res, state, buf);
						break;
					case lexState.STRING:
						lex.addLex(res, lexState.STRING, buf);
						break;
					case lexState.OPERATOR:
						if (! lex.addLex(res, lexState.OPERATOR, buf, true))
							lex.addLex(res, lexState.ERROR, buf);
						break;
					case lexState.DOT:
						lex.addLex(res, lexState.SEPARATOR, buf);
						break;
					case lexState.WORD:
						if (! lex.addLex(res, lexState.KEYWORD, buf, true))
							if (! lex.addLex(res, lexState.LITERAL, buf, true))
								lex.addLex(res, lexState.IDENTIFIER, buf);
						break;
					case lexState.LITERAL:
						lex.addLex(res, lexState.LITERAL, buf);
						break;
					case lexState.ERROR:
						lex.addLex(res, lexState.ERROR, buf);
						break;
				}
			}
		}
		return res;
	}
}