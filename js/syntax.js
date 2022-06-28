blSyntax = {
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
			SEPARATOR: {/* Разделители */
				isArr: [' ', '\t', ';', '{', '}', '[', ']', '(', ')']
			},
			SYMBOL: {/* Используемые в операторах символы */
				isArr: ['>', '<', '=', '+', '-', '/', '!', '&', '|', '*', '%', '$', '^', '~', ':', '?', '@', '\\']
			},
			QUOTES: {/* Используемые кавычки */
				isArr: ['"', '\'']
			},
			LINE: {/* Символ перевода строки */
				isArr: ['\n']
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
		 * 		соответствия своему состоянию, при значении true, функция возвозвращает результат проверки
		 * @param {object} [attr = null] - Дополнительные атрибуты лексемы
		 * @return {null|boolean} - Функция возвращает результат проверки лексемы на соответствие, если такая проверка
		 * 		производится (check = true)
		 */
		addLex(list, state, text, check = false, attr = null) {
			var body = {text: text, state: state};
			if (attr != null) {
				body['attr'] = attr;
			}
			if (! check)
				list.push(body);
			else
				if (this.isThis(text, state)) {
					list.push(body);
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
			/* from: org.zenframework.z8.pde.editor.document.CodeScanner.java */
			ATTRIBUTE: {
				style: 'spanAttribute',
				isArr: ["name", "native", "displayName", "columnHeader", "generatable", "entry", "request", "ui",
					"presentation", "system", "description", "icon", "job", "exportable", "foreignKey"]
			},
			KEYWORD: {
				style: 'spanKeyword',
				isArr: ["auto", "break", "catch", "class", "container", "continue", "do", "else", "enum", "extends",
					"exception", "finally", "for", "if", "new", "private", "protected", "public", "records", "return",
					"static", "super", "this", "throw", "try", "while", "virtual", "operator", "import", "final",
					"instanceof"]/* null > literal */
			},
			TYPE: {
				style: 'spanType',
				isArr: ["void", "binary", "bool", "date", "datetime", "datespan", "decimal", "guid", "geometry",
					"file", "int", "string", "sql_binary", "sql_bool", "sql_date", "sql_datetime", "sql_datespan",
					"sql_decimal", "sql_guid", "sql_geometry", "sql_int", "sql_string"]
			},
			LITERAL: {
				style: 'spanLiteral',
				isArr: ['true', 'false', 'null']
			},
			OPERATOR: {
				style: 'spanOperator',
				isArr: ['=', '+', '-', '*', '/', '++', '--', '!', '==', '!=', '>', '<', '>=', '<=', '&&', '||',
				'+=', '-=', '*=', '/=', '%=', '$=', '^=', '|=', ',', '%', '&', '|', '^', '~', ':', '?', '>>', '<<',
				'>>>', '<<=', '>>=']
			},
			DOT: {
				style: 'spanSeparator'
			},
			WORD: {},
			ESCAPE_CHAR: {
				style: 'spanEscapeChar',
				isArr: ['t', 'b', 'n', 'r', 'f', '\'', '"', '\\']
			},
			STRING_Q1: {
				style: 'spanString'
			},
			STRING_Q2: {
				style: 'spanString'
			},
			DOC: {
				style: 'spanDoc'
			},
			DOC_OPEN: {
				style: 'spanDoc'
			},
			DOC_CLOSE: {
				style: 'spanDoc'
			},
			DOC_DESCRIPTOR: {
				style: 'spanDocDescriptor',
				isArr: ['@author', '@version', '@since', '@see', '@param', '@return', '@exception', '@throws',
					'@deprecated', '@link', '@value']
			},
			COMMENT_INLINE: {
				style: 'spanComment'
			},
			COMMENT_BLOCK: {
				style: 'spanComment'
			},
			COMMENT_BLOCK_OPEN: {
				style: 'spanComment'
			},
			COMMENT_BLOCK_CLOSE: {
				style: 'spanComment'
			},
			IDENTIFIER: {
				style: 'spanIdentifiers'
			},
			SEPARATOR: {
				style: 'spanSeparator',
				isArr: [' ', '\t', ';', '{', '}', '[', ']', '(', ')']
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
	 * @param {object|null} [startState = null] - Начальное состояние лексемы, к с которого начнется парсинг,
	 *		если не задан или null то парсинг начинается с пустого состояния EMPTY
	 * @return {object[]} - Возвращает результат парсинга следующего формата [[lex, ..], lastState],
	 *		где lastState - состояние лексемы к концу парсинга, lex - объект лексемы, формата {text, state[, attr]},
	 *		где text - текст лексемы, state - состояние лексемы, attr - дополнительные атрибуты лексемы
	*/
	parseText(text, startState = null) {
		var lex = this.lex;
		var lexState = lex.state;
		var lexType = lex.stateType;
		var char = this.char;
		var charType = char.type;

		var res = [];
		var resState = null;
		var buf = '';
		var type = lexType.UNDEFINED;
		var state = startState;
		if (state == null)
			state = lexState.EMPTY;

		var length = text.length;
		for (var i = 0; i <= length; i++) {
			if (i == length) {
				if (buf.length > 0) {
					switch (state) {
						case lexState.DOC_DESCRIPTOR:
						case lexState.DOC:
						case lexState.DOC_OPEN:
							resState = lexState.DOC;
							lex.addLex(res, state, buf);
							break;
						case lexState.COMMENT_BLOCK_OPEN:
						case lexState.COMMENT_BLOCK:
							resState = lexState.COMMENT_BLOCK;
							lex.addLex(res, state, buf);
							break;
						case lexState.DOT:
						case lexState.COMMENT_INLINE:
						case lexState.OPERATOR:
						case lexState.LITERAL:
							lex.addLex(res, state, buf);
							break;
						case lexState.STRING_Q1:
						case lexState.STRING_Q2:
							lex.addLex(res, state, buf, false, {error: 1});
							break;
						case lexState.WORD:
							if (lex.addLex(res, lexState.KEYWORD, buf, true))
								break;
							if (lex.addLex(res, lexState.LITERAL, buf, true))
								break;
							if (lex.addLex(res, lexState.ATTRIBUTE, buf, true))
								break;
							if (lex.addLex(res, lexState.TYPE, buf, true))
								break;
							lex.addLex(res, lexState.IDENTIFIER, buf);
							break;
					}
				}
				break;
			}

			var c = text.charAt(i);
			if (c == '\r')
				continue;
			switch (char.getType(c)) {
				case charType.LINE:
					switch (state) {
						case lexState.DOC_DESCRIPTOR:
						case lexState.COMMENT_BLOCK_OPEN:
						case lexState.DOC:
						case lexState.DOC_OPEN:
						case lexState.COMMENT_BLOCK:
							lex.addLex(res, state, buf);
							lex.addLex(res, lexState.LINE, '');
							buf = '';
							continue;
						case lexState.DOT:
						case lexState.COMMENT_INLINE:
						case lexState.OPERATOR:
						case lexState.LITERAL:
							lex.addLex(res, state, buf);
							break;
						case lexState.STRING_Q1:
						case lexState.STRING_Q2:
							lex.addLex(res, state, buf, false, {error: 1});
							break;
						case lexState.WORD:
							if (lex.addLex(res, lexState.KEYWORD, buf, true))
								break;
							if (lex.addLex(res, lexState.LITERAL, buf, true))
								break;
							if (lex.addLex(res, lexState.ATTRIBUTE, buf, true))
								break;
							if (lex.addLex(res, lexState.TYPE, buf, true))
								break;
							lex.addLex(res, lexState.IDENTIFIER, buf);
							break;
					}
					lex.addLex(res, lexState.LINE, '');
					buf = '';
					state = lexState.EMPTY;
					break;
				case charType.SEPARATOR:
					switch (state) {
						case lexState.COMMENT_BLOCK_OPEN:
							lex.addLex(res, lexState.COMMENT_BLOCK_OPEN, buf);
							buf = c;
							state = lexState.COMMENT_BLOCK;
							continue;
						case lexState.DOC_OPEN:
							lex.addLex(res, lexState.DOC_OPEN, buf);
							buf = c;
							state = lexState.DOC;
							continue;
						case lexState.STRING_Q1:
						case lexState.STRING_Q2:
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
						case lexState.DOC:
							buf += c;
							continue;
						case lexState.DOC_DESCRIPTOR:
							if (c == ' ' || c == '\t') {
								lex.addLex(res, lexState.DOC_DESCRIPTOR, buf);
								buf = c;
								state = lexState.DOC;
								continue;
							}
							buf += c;
							continue;
						case lexState.WORD:
							if (lex.addLex(res, lexState.KEYWORD, buf, true))
								break;
							if (lex.addLex(res, lexState.LITERAL, buf, true))
								break;
							if (lex.addLex(res, lexState.ATTRIBUTE, buf, true))
								break;
							if (lex.addLex(res, lexState.TYPE, buf, true))
								break;
							lex.addLex(res, lexState.IDENTIFIER, buf);
							break;
						case lexState.LITERAL:
						case lexState.OPERATOR:
						case lexState.DOT:
							lex.addLex(res, state, buf);
							break;
					}
					lex.addLex(res, lexState.SEPARATOR, c);
					buf = '';
					state = lexState.EMPTY;
					break;
				case charType.QUOTES:
					switch (state) {
						case lexState.COMMENT_BLOCK_OPEN:
							lex.addLex(res, lexState.COMMENT_BLOCK_OPEN, buf);
							buf = c;
							state = lexState.COMMENT_BLOCK;
							continue;
						case lexState.DOC_OPEN:
							lex.addLex(res, lexState.DOC_OPEN, buf);
							buf = c;
							state = lexState.DOC;
							continue;
						case lexState.DOC:
						case lexState.DOC_DESCRIPTOR:
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
							buf += c;
							continue;
						case lexState.STRING_Q1:
							if (buf.length > 0) {
								if (buf[buf.length - 1] == '\\') {
									if (c == '"' || c == '\'') {
										if (buf.length > 1) {
											lex.addLex(res, state, buf.slice(0, buf.length-1));
										}
										lex.addLex(res, lexState.ESCAPE_CHAR, buf[buf.length-1] + c);
										buf = '';
										continue;
									}
								}
							}
							buf += c;
							if (c == '\'') {
								lex.addLex(res, lexState.STRING_Q1, buf);
								buf = '';
								state = lexState.EMPTY;
								continue;
							}
							continue;
						case lexState.STRING_Q2:
							if (buf.length > 0) {
								if (buf[buf.length - 1] == '\\') {
									if (c == '"' || c == '\'') {
										if (buf.length > 1) {
											lex.addLex(res, state, buf.slice(0, buf.length-1));
										}
										lex.addLex(res, lexState.ESCAPE_CHAR, buf[buf.length-1] + c);
										buf = '';
										continue;
									}
								}
							}
							buf += c;
							if (c == '"') {
								lex.addLex(res, lexState.STRING_Q2, buf);
								buf = '';
								state = lexState.EMPTY;
								continue;
							}
							continue;
						case lexState.WORD:
							if (lex.addLex(res, lexState.KEYWORD, buf, true))
								break;
							if (lex.addLex(res, lexState.LITERAL, buf, true))
								break;
							if (lex.addLex(res, lexState.ATTRIBUTE, buf, true))
								break;
							if (lex.addLex(res, lexState.TYPE, buf, true))
								break;
							lex.addLex(res, lexState.IDENTIFIER, buf);
							break;
						case lexState.LITERAL:
						case lexState.OPERATOR:
						case lexState.DOT:
							lex.addLex(res, state, buf);
							break;
					}
					buf = c;
					if (c == '\'')
						state = lexState.STRING_Q1;
					if (c == '"')
						state = lexState.STRING_Q2;
					break;
				case charType.SYMBOL:
					switch (state) {
						case lexState.OPERATOR:
							buf += c;
							if (buf.length >= 2) {
								if (buf[buf.length - 2] == '/') {
									if (buf[buf.length - 1] == '*') {
										if (buf.length > 2) {
											lex.addLex(res, lexState.OPERATOR, buf.slice(0, buf.length - 2));
										}
										buf = buf.slice(buf.length - 2, buf.length);
										state = lexState.COMMENT_BLOCK_OPEN;
									}
									if (buf[buf.length - 1] == '/') {
										if (buf.length > 2) {
											lex.addLex(res, lexState.OPERATOR, buf.slice(0, buf.length - 2));
										}
										lex.addLex(res, lexState.COMMENT_INLINE, buf.slice(buf.length - 2, buf.length));
										state = lexState.COMMENT_INLINE;
										buf = '';
									}
								}
							}
							continue;
						case lexState.DOC_DESCRIPTOR:
						case lexState.DOC:
							if (c == '@') {
								lex.addLex(res, state, buf);
								state = lexState.DOC_DESCRIPTOR;
								buf = c;
								continue;
							}
							buf += c;
							if (buf.length >= 2) {
								if (buf[buf.length-2] == '*' && buf[buf.length-1] == '/') {
									if (buf.length > 2) {
										buf = buf.slice(0, buf.length-2);
										lex.addLex(res, state, buf);
									}
									lex.addLex(res, lexState.DOC_CLOSE, '*/');
									buf = '';
									state = lexState.EMPTY;
									continue;
								}
							}
							continue;
						case lexState.DOC_OPEN:
							if (c == '/') {
								lex.addLex(res, lexState.COMMENT_BLOCK_OPEN, buf.slice(0, 2));
								lex.addLex(res, lexState.COMMENT_BLOCK_CLOSE, buf[2] + c);
								buf = '';
								state = lexState.EMPTY;
								continue;
							}
							if (c == '@') {
								lex.addLex(res, lexState.DOC_OPEN, buf);
								state = lexState.DOC_DESCRIPTOR;
								buf = c;
								continue;
							}
							lex.addLex(res, lexState.DOC_OPEN, buf);
							buf = c;
							state = lexState.DOC;
							continue;
						case lexState.COMMENT_BLOCK_OPEN:
							buf += c;
							if (buf == '/**') {
								state = lexState.DOC_OPEN;
								continue
							}
							lex.addLex(res, lexState.COMMENT_BLOCK_OPEN, buf.slice(0, 2));
							state = lexState.COMMENT_BLOCK;
							buf = buf[2];
							continue;
						case lexState.COMMENT_INLINE:
							buf += c;
							continue;
						case lexState.COMMENT_BLOCK:
							buf += c;
							if (buf.length >= 2) {
								if (buf[buf.length-2] == '*' && buf[buf.length-1] == '/') {
									if (buf.length > 2) {
										lex.addLex(res, lexState.COMMENT_BLOCK, buf.slice(0, buf.length-2));
									}
									lex.addLex(res, lexState.COMMENT_BLOCK_CLOSE, buf.slice(buf.length-2, buf.length));
									buf = '';
									state = lexState.EMPTY;
									continue;
								}
							}
							continue;
						case lexState.STRING_Q1:
						case lexState.STRING_Q2:
							if (buf.length > 0) {
								if (buf[buf.length - 1] == '\\') {
									if (c == '\\') {
										if (buf.length > 1) {
											lex.addLex(res, state, buf.slice(0, buf.length-1));
										}
										lex.addLex(res, lexState.ESCAPE_CHAR, buf[buf.length-1] + c);
										buf = '';
										continue;
									}
								}
							}
							buf += c;
							continue;
						case lexState.WORD:
							if (lex.addLex(res, lexState.KEYWORD, buf, true))
								break;
							if (lex.addLex(res, lexState.LITERAL, buf, true))
								break;
							if (lex.addLex(res, lexState.ATTRIBUTE, buf, true))
								break;
							if (lex.addLex(res, lexState.TYPE, buf, true))
								break;
							lex.addLex(res, lexState.IDENTIFIER, buf);
							break;
						case lexState.LITERAL:
							if (type == lexType.NUM_E && (c == '+' || c == '-')) {
								buf += c;
								type = lexType.NUM_E_S;
								continue;
							} else {
								lex.addLex(res, lexState.LITERAL, buf);
							}
							break;
						case lexState.DOT:
							lex.addLex(res, state, buf);
							break;
					}
					buf = c;
					state = lexState.OPERATOR;
					break;
				case charType.DOT:
					switch (state) {
						case lexState.COMMENT_BLOCK_OPEN:
							lex.addLex(res, lexState.COMMENT_BLOCK_OPEN, buf);
							buf = c;
							state = lexState.COMMENT_BLOCK;
							continue;
						case lexState.DOC_OPEN:
							lex.addLex(res, lexState.DOC_OPEN, buf);
							buf = c;
							state = lexState.DOC;
							continue;
						case lexState.STRING_Q1:
						case lexState.STRING_Q1:
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
						case lexState.DOC:
						case lexState.DOC_DESCRIPTOR:
							buf += c;
							continue;
						case lexState.WORD:
							if (lex.addLex(res, lexState.KEYWORD, buf, true))
								break;
							if (lex.addLex(res, lexState.LITERAL, buf, true))
								break;
							if (lex.addLex(res, lexState.ATTRIBUTE, buf, true))
								break;
							if (lex.addLex(res, lexState.TYPE, buf, true))
								break;
							lex.addLex(res, lexState.IDENTIFIER, buf);
							break;
						case lexState.LITERAL:
							if (type == lexType.NUM_N) {
								buf += c;
								type = lexType.NUM_D;
								continue;
							}
							lex.addLex(res, lexState.LITERAL, buf);
							break;
						case lexState.OPERATOR:
						case lexState.DOT:
							lex.addLex(res, state, buf);
							break;
					}
					lex.addLex(res, lexState.DOT, c);
					buf = '';
					state = lexState.EMPTY;
					break;
				case charType.LETTER:
					switch (state) {
						case lexState.COMMENT_BLOCK_OPEN:
							lex.addLex(res, lexState.COMMENT_BLOCK_OPEN, buf);
							buf = c;
							state = lexState.COMMENT_BLOCK;
							continue;
						case lexState.DOC_OPEN:
							lex.addLex(res, lexState.DOC_OPEN, buf);
							buf = c;
							state = lexState.DOC;
							continue;
						case lexState.STRING_Q1:
						case lexState.STRING_Q2:
							if (buf.length > 0) {
								if (buf[buf.length - 1] == '\\') {
									if (lex.isThis(c, lexState.ESCAPE_CHAR)) {
										if (buf.length > 1) {
											lex.addLex(res, state, buf.slice(0, buf.length-1));
										}
										lex.addLex(res, lexState.ESCAPE_CHAR, buf[buf.length-1] + c);
										buf = '';
										continue;
									}
								}
							}
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
						case lexState.DOC:
						case lexState.DOC_DESCRIPTOR:
						case lexState.WORD:
							buf += c;
							continue;
						case lexState.LITERAL:
							if (type == lexType.NUM_HEX && char.isThis(c, charType.NUM.HEX)) {
								buf += c;
								continue;
							}
							if (char.isThis(c, charType.LETTER.LITERAL_LETTER)) {
								switch (c) {
									case 'L':
									case 'l':
										if (type == lexType.NUM_N || type == lexType.NUM_HEX) {
											buf += c;
											lex.addLex(res, lexState.LITERAL, buf);
											buf = '';
											state = lexState.EMPTY;
											continue;
										}
										break;
									case 'E':
									case 'e':
										if (type == lexType.NUM_N || type == lexType.NUM_D_N) {
											type = lexType.NUM_E;
											buf += c;
											continue;
										}
										break;
									case 'X':
									case 'x':
										if (buf[0] == '0' && buf.length == 1) {
											type = lexType.NUM_HEX;
											buf += c;
											continue;
										}
										break;
									case 'B':
									case 'b':
										if (buf[0] == '0' && buf.length == 1) {
											type = lexType.NUM_BIN;
											buf += c;
											continue
										}
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
											continue;
										}
										break;
								}
							}
							lex.addLex(res, lexState.LITERAL, buf);
							break;
						case lexState.OPERATOR:
						case lexState.DOT:
							lex.addLex(res, state, buf);
							break;
					}
					buf = c;
					state = lexState.WORD;
					break;
				case charType.NUM:
					switch (state) {
						case lexState.COMMENT_BLOCK_OPEN:
							lex.addLex(res, lexState.COMMENT_BLOCK_OPEN, buf);
							buf = c;
							state = lexState.COMMENT_BLOCK;
							continue;
						case lexState.DOC_OPEN:
							lex.addLex(res, lexState.DOC_OPEN, buf);
							buf = c;
							state = lexState.DOC;
							continue;
						case lexState.STRING_Q1:
						case lexState.STRING_Q2:
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
						case lexState.DOC:
						case lexState.DOC_DESCRIPTOR:
						case lexState.WORD:
							buf += c;
							continue;
						case lexState.OPERATOR:
							lex.addLex(res, lexState.OPERATOR, buf);
							break;
						case lexState.DOT:
							buf += c;
							state = lexState.LITERAL;
							type = lexType.NUM_D;
							continue;
						case lexState.LITERAL:
							buf += c;
							switch (type) {
								case lexType.NUM_D:
									type = lexType.NUM_D_N;
									break;
								case lexType.NUM_N:
									if (buf.length == 2 && buf[0] == '0') {
										if (!char.isThis(c, charType.NUM.OCT)) {
											lex.addLex(res, lexState.LITERAL, buf, false, {error: 11});
											buf = '';
											state = lexState.EMPTY;
										} else {
											type = lexType.NUM_OCT;
										}
									}
									break;
								case lexType.NUM_BIN:
									if (!char.isThis(c, charType.NUM.BIN)) {
										lex.addLex(res, lexState.LITERAL, buf, false, {error: 12});
										buf = '';
										state = lexState.EMPTY;
									}
									break;
								case lexType.NUM_OCT:
									if (!char.isThis(c, charType.NUM.OCT)) {
										lex.addLex(res, lexState.LITERAL, buf, false, {error: 11});
										buf = '';
										state = lexState.EMPTY;
									}
									break;
								case lexType.NUM_E:
								case lexType.NUM_E_S:
									type = lexType.NUM_E_N;
									break;
							}
							continue;
					}
					buf = c;
					state = lexState.LITERAL;
					type = lexType.NUM_N;
					break;
				case charType.UNDEFINED:
					switch (state) {
						case lexState.COMMENT_BLOCK_OPEN:
							lex.addLex(res, lexState.COMMENT_BLOCK_OPEN, buf);
							buf = c;
							state = lexState.COMMENT_BLOCK;
							continue;
						case lexState.DOC_OPEN:
							lex.addLex(res, lexState.DOC_OPEN, buf);
							buf = c;
							state = lexState.DOC;
							continue;
						case lexState.STRING_Q1:
						case lexState.STRING_Q2:
						case lexState.COMMENT_INLINE:
						case lexState.COMMENT_BLOCK:
						case lexState.DOC:
						case lexState.DOC_DESCRIPTOR:
							buf += c;
							continue;
						case lexState.OPERATOR:
						case lexState.DOT:
						case lexState.LITERAL:
						case lexState.WORD:
							lex.addLex(res, state, buf);
							break;
					}
					lex.addLex(res, lexState.WORD, c, false, {error: 13});
					buf = '';
					state = lexState.EMPTY;
					break;
			}
		}
		return [res, resState];
	}
}