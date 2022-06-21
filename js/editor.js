var editor = {
	//Текущий выбранный синтаксис
	currentSyntax: null,
	//Данные для каждого синтаксиса
	syntax: {
		java: {}
	},

	/** Объект для определения типа разбираемых символов */
	char: {
		/** Получить ссылку на тип символа
		 * @param {string} c - Проверяемый символ
		 * @return {object} Тип символа (char.type)
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
		 * @property {object} <TYPE> - Объект типа символа
		 * @property {number[][]} <TYPE>.isInterval - Массив интервалов кодов символов, определяющих данный тип
		 * @property {string[]} <TYPE>.isArr - Массив символов определяющих данный тип
		 * @property {object} <TYPE>.<SUB_TYPE> - Объект типа символа (подтипы), внутренняя структура та же
		*/
		type: {
			LETTER: {
				isInterval: [[65, 90], [97, 122]],
				isArr: ['_'],
				LITERAL_LETTER: {
					isArr: ['X', 'x', 'B', 'b', 'D', 'd', 'F', 'f', 'L', 'l', 'E', 'e']
				}
			},
			NUM: {
				isInterval: [[48, 57]],
				BIN: {
					isArr: ['0', '1']
				},
				OCT: {
					isInterval: [[48, 55]]
				},
				HEX: {
					isInterval: [[48, 57], [97, 102], [65, 70]]
				},
			},
			DOT: {
				isArr: ['.']
			},
			LINE: {
				isArr: ['\n']
			},
			SEPARATOR: {
				isArr: [' ', '\t', ';', '{', '}', '[', ']', '(', ')']
			},
			SYMBOL: {
				isArr: ['>', '<', '=', '+', '-', '/', '!', '&', '|', '*', '%', '$', '^', '~', ':', '?']
			},
			QUOTES: {
				isArr: ['"']
			},
			UNDEFINED: {}
		}
	},
	/** Объект для определения типа лексем разбираемого текста */
	lex: {
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
			}
		},
		/* Тип-состояния лексем (пока что только числа):
		 * @property UNDEFINED - Не определен
		 * @property NUM_N - Цифры без символов
		 * @property NUM_D - Цифры с точкой на конце
		 * @property NUM_D_N - Цифры+точка+цифры
		 * @property NUM_E - Цифры+буква Е (экспонента)
		 * @property NUM_E_S - Цифры+Е+знак(+ или -)
		 * @property NUM_E_N - Цифры+Е(со знаками или без)+цифры
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
	//Имена стилей, используемых в редакторе
	css: {
		editor: 'editor',
		editorScroll: 'editor-s',
		numberContainer: 'editor-s-num',
		textContainer: 'editor-s-text',
		navigationContainer: 'editor-navigation',
		line: 'line',
		lineActive: 'line-active',
		lineError: 'line-er',
		lineWarning: 'line-wr',
		numberLine: 'num-line',
		numberLineActive: 'num-line-active',
		numberLineImg: 'num-line-img',
		numberLineValue: 'num-line-num',
		spanError: 'er',
		spanWarning: 'wr',
		spanComment: 'c',
		spanString: 's',
		spanOperator: 'o',
		spanSeparator: 'sp',
		spanKeyword: 'k',
		spanIdentifiers: 'i',
		spanLiteral: 'l'
	},
	//Id основных элементов
	elementId: {},
	//Постфиксы основных элементов, для генерации id
	elementIdPostfix: {
		editorScroll: '-s',
		numberContainer: '-num',
		textContainer: '-text',
		navigationContainer: '-nav',
		line: '-l-',
		numberLine: '-n'
	},
	//Адреса ресурсов, используемых в редакторе
	resources: {
		errorImg: 'img/er.png',
		warningImg: 'img/wr.png'
	},
	//Переменные для работы с линиями
	lines: {
		cnt: 0,
		numBeforeInput: 0,
		numAtInput: 0,
		selected: null
	},

	/** Инициализация редактора
	 * @param {string} containerId - Id контейнера, в котором будет размещен редактор
	 * @param {string} syntax - Название используемого синтаксиса
	 * @param {string} [text = ''] - Начальный текст
	*/
	init(containerId, syntax, text = '') {
		//Генерация и сохранение id основных контейнеров редактора
		this.elementId.editor = containerId;
		this.elementId.editorScroll = containerId + this.elementIdPostfix.editorScroll;
		this.elementId.numberContainer = containerId + this.elementIdPostfix.numberContainer;
		this.elementId.textContainer = containerId + this.elementIdPostfix.textContainer;
		this.elementId.navigationContainer = containerId + this.elementIdPostfix.navigationContainer;

		//Создание основных контейнеров
		var editor = document.getElementById(this.elementId.editor);
		editor.className = this.css.editor;
			var editorScroll = document.createElement('div');
			editorScroll.id = this.elementId.editorScroll;
			editorScroll.className = this.css.editorScroll;
			editor.append(editorScroll);
				var numberContainer = document.createElement('div');
					numberContainer.id = this.elementId.numberContainer;
					numberContainer.className = this.css.numberContainer;
					editorScroll.append(numberContainer);
				var textContainer = document.createElement('div');
					textContainer.id = this.elementId.textContainer;
					textContainer.className = this.css.textContainer;
					textContainer.setAttribute('contenteditable', 'true');
					textContainer.setAttribute('spellcheck', 'false');
					textContainer.setAttribute('autocorrect', 'off');
					textContainer.setAttribute('autocapitalize', 'off');
					textContainer.setAttribute('translate', 'no');
					textContainer.setAttribute('aria-multiline', 'true');
					editorScroll.append(textContainer);
			var navigationContainer = document.createElement('div');
			navigationContainer.id = this.elementId.navigationContainer;
			navigationContainer.className = this.css.navigationContainer;
			editor.append(navigationContainer);

		//Установка текущего синтаксиса
		this.currentSyntax = syntax;
		//Создание пустой строки, с начальным текстом
		var line = document.createElement('div');
		line.classList.add(this.css.line);
		line.innerHTML = text;
		textContainer.append(line);
		textContainer.focus();
		//Парсим строку
		this.parseLine(line);

		var thisObj = this;
		textContainer.addEventListener('paste', function(e) {
			e.preventDefault();
		});
		textContainer.addEventListener('drop', function(e) {
			e.preventDefault();
		});
		textContainer.addEventListener('beforeinput', function(e) {
			thisObj['lines']['numBeforeInput'] = textContainer.childNodes.length;
		});
		textContainer.addEventListener('input', function(e) {
			thisObj['lines']['numAtInput'] = textContainer.childNodes.length;
			var selection = document.getSelection();
			var line = thisObj.getLineNode(selection.anchorNode);
			if (line != null)
				thisObj.parseLine(line);
			else {
				var a = document.getElementById(thisObj['elementId']['textContainer']);
				a.innerHTML = '';
				var b = document.createElement('div');
				b.classList.add(thisObj['css']['line'], thisObj['css']['lineActive']);
				var c = document.createTextNode('');
				b.append(c);
				a.append(b);
				a.focus();
				thisObj.setCursor(b,0);
			}
		});
		textContainer.addEventListener('keydown', function(e) {
			if (e.keyCode == 9) {
				thisObj.enterTextInLine('\t');
				e.preventDefault();
			}
			if (e.keyCode == 13) {
				thisObj.enterTextInLine('\n');
				e.preventDefault();
			}
		}, false);
		textContainer.addEventListener('mouseup', function(e) {
			thisObj.checkLineActive();
		});
		textContainer.addEventListener('keyup', function(e) {
			if (e.keyCode >= 37 && e.keyCode <= 40)
				thisObj.checkLineActive();
		});
	},

	/** Обновляет значок ошибки/предупреждения на указанной линии
	 * @param {Element} node - Линия
	 * @param {boolean} containsErrors - Содержатся ли на линии ошибки
	 * @param {boolean} containsWarnings - Содержатся ли на линии предупреждения
	*/
	updateLineErrorImg(node, containsErrors, containsWarnings) {
		if (containsErrors) {
			node.classList.add(this.css.lineError);
			var numLine = document.getElementById(node.id + this.elementIdPostfix.numberLine);
			if (numLine != null) {
				var numLineImg = numLine.getElementsByClassName(this.css.numberLineImg);
				if (numLineImg.length == 0)
					this.addNumLineImg(numLine, 'errorImg');
				else {
					numLineImg[0].remove();
					this.addNumLineImg(numLine, 'errorImg');
				}
			}
		} else {
			if (containsWarnings) {
				node.classList.add(this.css.lineWarning);
				var numLine = document.getElementById(node.id + this.elementIdPostfix.numberLine);
				if (numLine != null) {
					var numLineImg = numLine.getElementsByClassName(this.css.numberLineImg);
					if (numLineImg.length == 0)
						this.addNumLineImg(numLine, 'warningImg');
					else {
						numLineImg[0].remove();
						this.addNumLineImg(numLine, 'warningImg');
					}
				}
			} else {
				var numLine = document.getElementById(node.id + this.elementIdPostfix.numberLine);
				if (numLine != null) {
					var numLineImg = numLine.getElementsByClassName(this.css.numberLineImg);
					if (numLineImg.length > 0)
						numLineImg[0].remove();
				}
			}
		}
	},
	/** Добавляет спан к указаной линии и задает стиль. Если текстовый указатель находился на содержимом этого спана,
	возвращаем его на место (он сбивается после очистки линий при парсинге).
	 * @param {Element} parentLine - Линия, внутри которой размещается спан
	 * @param {string} className - Класс спана (Зависит от лексемы, которую он выделяет)
	 * @param {string} content - Содержимое спана
	 * @param {number} lineOffset - Позиция текстового указателя внутри родительской линии
	 * @param {number} endIndex - Позиция последнего символа содержимого спана, в контексте родительской линии
	*/
	appendSpan(parentLine, lex, content, lineOffset, endIndex) {
		var span = document.createElement('span');
		span.className = this.css[lex.style];
		var text = document.createTextNode(content);
		span.append(text);
		parentLine.append(span);

		if (lineOffset != null) {
			var offset = content.length - (endIndex - lineOffset);
			if (offset <= content.length && offset >= 0)
				this.setCursor(text, offset);
		}
	},
	/** Парсит содержимое линии, посимвольно разбирает текст
	 * @param {Element} node - Разбираемая линия
	*/
	parseLine(node) {
		if (this.containsClass(node, this.css.line)) {
			//Очищаем линию от классов ошибок
			node.classList.remove(this.css.lineError, this.css.lineWarning);
			//Определяем смещение каретки относительно линии
			var offset = this.getCursor(node);
			//Сохраняем текст линии и очищаем ее
			var text = node.textContent;
			node.innerHTML = "";
			//Были ли добавлены новые линии в ходе работы метода
			var linesAdded = false;
			//Были ли найдены ошибки и предупреждения в ходе работы метода
			var containsErrors = false;
			var containsWarnings = false;
			//Буфер, для записи и анализа текущей лексемы
			var buf = '';
			var lex = this.lex;
			var lexState = lex.state;
			var lexType = lex.state;
			var char = this.char;
			var charType = char.type;

			var type = lexType.UNDEFINED;
			var state = lexState.EMPTY;

			for (var i = 0; i < text.length; i++) {
				var c = text.charAt(i);

				//Далее в зависимости от текущего символа строки, состояния и типа текущей лексемы, делаем разбор
				switch (char.getType(c)) {
					case charType.LINE:
						switch (state) {
							case lexState.COMMENT_INLINE:
							case lexState.COMMENT_BLOCK:
							case lexState.STRING:
								this.appendSpan(node, state, buf, offset, i);
								break;
							case lexState.OPERATOR:
								if (lex.isThis(buf, lexType.OPERATOR)) {
									this.appendSpan(node, lexState.OPERATOR, buf, offset, i);
								} else {
									this.appendSpan(node, lexState.ERROR, buf, offset, i);
									containsErrors = true;
								}
								break;
							case lexState.DOT:
								this.appendSpan(node, lexState.SEPARATOR, buf, offset, i);
								break;
							case lexState.WORD:
								if (lex.isThis(buf, lexState.KEYWORD)) {
									this.appendSpan(node, lexState.KEYWORD, buf, offset, i);
								} else {
									if (lex.isThis(buf, lexType.LITERAL)) {
										this.appendSpan(node, lexState.LITERAL, buf, offset, i);
									} else {
										this.appendSpan(node, lexState.IDENTIFIER, buf, offset, i);
									}
								}
								break;
							case lexState.LITERAL:
								this.appendSpan(node, lexState.LITERAL, buf, offset, i);
								break;
							case lexState.ERROR:
								this.appendSpan(node, lexState.ERROR, buf, offset, i);
								containsErrors = true;
								break;
						}
						//this.appendSpan(node, 'new-line', '\n', offset, i);

						this.updateLineErrorImg(node, containsErrors, containsWarnings);
						containsErrors = false;

						var newLine = document.createElement('div');
						newLine.className = this.css.line;
						if (node.nextSibling != null) {
							node.parentNode.insertBefore(newLine,node.nextSibling);
						} else {
							node.parentNode.append(newLine);
						}
						node = newLine;
						linesAdded = true;
						offset = null;
						this.setCursor(node,0);
						buf = '';
						state = lexState.EMPTY;
						break;
					case charType.SEPARATOR:
						switch (state) {
							case lexState.STRING:
							case lexState.COMMENT_INLINE:
							case lexState.COMMENT_BLOCK:
								buf += c;
								break;
							case lexState.EMPTY:
								this.appendSpan(node, lexState.SEPARATOR, c, offset, i+1);
								buf = '';
								state = lexState.EMPTY;
								break;
							case lexState.OPERATOR:
								if (lex.isThis(buf, lexType.OPERATOR)) {
									this.appendSpan(node, lexState.OPERATOR, buf, offset, i);
								} else {
									this.appendSpan(node, lexState.ERROR, buf, offset, i);
									containsErrors = true;
								}
								this.appendSpan(node, lexState.SEPARATOR, c, offset, i+1);
								buf = '';
								state = lexState.EMPTY;
								break;
							case lexState.DOT:
								this.appendSpan(node, lexState.SEPARATOR, buf, offset, i);
								this.appendSpan(node, lexState.SEPARATOR, c, offset, i+1);
								buf = '';
								state = lexState.EMPTY;
								break;
							case lexState.WORD:
								if (lex.isThis(buf, lexType.KEYWORD)) {
									this.appendSpan(node, lexState.KEYWORD, buf, offset, i);
								} else {
									if (lex.isThis(buf, lexType.LITERAL)) {
										this.appendSpan(node, lexState.LITERAL, buf, offset, i);
									} else {
										this.appendSpan(node, lexState.IDENTIFIER, buf, offset, i);
									}
								}
								this.appendSpan(node, lexState.SEPARATOR, c, offset, i+1);
								buf = '';
								state = lexState.EMPTY;
								break;
							case lexState.LITERAL:
								this.appendSpan(node, lexState.LITERAL, buf, offset, i);
								this.appendSpan(node, lexState.SEPARATOR, c, offset, i+1);
								buf = '';
								state = lexState.EMPTY;
								break;
							case lexState.ERROR:
								this.appendSpan(node, lexState.ERROR, buf, offset, i);
								containsErrors = true;
								this.appendSpan(node, lexState.SEPARATOR, c, offset, i+1);
								buf = '';
								state = lexState.EMPTY;
								break;
						}
						break;
					case charType.QUOTES:
						switch (state) {
							case lexState.COMMENT_INLINE:
							case lexState.COMMENT_BLOCK:
								buf += c;
								break;
							case lexState.STRING:
								buf += c;
								this.appendSpan(node, lexState.STRING, buf, offset, i+1);
								buf = '';
								state = lexState.EMPTY;
								break;
							case lexState.EMPTY:
								buf += c;
								state = lexState.STRING;
								break;
							case lexState.OPERATOR:
								if (lex.isThis(buf, lexType.OPERATOR)) {
									this.appendSpan(node, lexState.OPERATOR, buf, offset, i);
								} else {
									this.appendSpan(node, lexState.ERROR, buf, offset, i);
									containsErrors = true;
								}
								buf = c;
								state = lexState.STRING;
								break;
							case lexState.DOT:
								this.appendSpan(node, lexState.SEPARATOR, buf, offset, i);
								buf = c;
								state = lexState.STRING;
								break;
							case lexState.WORD:
								if (lex.isThis(buf, lexType.KEYWORD)) {
									this.appendSpan(node, lexState.KEYWORD, buf, offset, i);
								} else {
									if (lex.isThis(buf, lexType.LITERAL)) {
										this.appendSpan(node, lexState.LITERAL, buf, offset, i);
									} else {
										this.appendSpan(node, lexState.IDENTIFIER, buf, offset, i);
									}
								}
								buf = c;
								state = lexState.STRING;
								break;
							case lexState.LITERAL:
								this.appendSpan(node, lexState.LITERAL, buf, offset, i);
								buf = c;
								state = lexState.STRING;
								break;
							case lexState.ERROR:
								this.appendSpan(node, lexState.ERROR, buf, offset, i);
								containsErrors = true;
								buf = c;
								state = lexState.STRING;
								break;
						}
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
									this.appendSpan(node, lexState.COMMENT_BLOCK, buf, offset, i+1);
									buf = '';
									state = lexState.EMPTY;
								}
								break;
							case lexState.EMPTY:
							case lexState.OPERATOR:
								/* TODO  =//  Переделать немного */
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
								this.appendSpan(node, lexState.SEPARATOR, buf, offset, i);
								buf = c;
								state = lexState.OPERATOR;
								break;
							case lexState.WORD:
								if (lex.isThis(buf, lexType.KEYWORD)) {
									this.appendSpan(node, lexState.KEYWORD, buf, offset, i);
								} else {
									if (lex.isThis(buf, lexType.LITERAL)) {
										this.appendSpan(node, lexState.LITERAL, buf, offset, i);
									} else {
										this.appendSpan(node, lexState.IDENTIFIER, buf, offset, i);
									}
								}
								buf = c;
								state = lexState.OPERATOR;
								break;
							case lexState.LITERAL:
								if (type == lexType.NUM_E && (c == '+' || c == '-')) {
									buf += c;
									type = lexType.NUM_E_S;
								} else {
									this.appendSpan(node, lexState.LITERAL, buf, offset, i);
									buf = c;
									state = lexState.OPERATOR;
								}
								break;
							case lexState.ERROR:
								this.appendSpan(node, lexState.ERROR, buf, offset, i);
								containsErrors = true;
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
								if (lex.isThis(buf, lexType.OPERATOR)) {
									this.appendSpan(node, lexState.OPERATOR, buf, offset, i);
								} else {
									this.appendSpan(node, lexState.ERROR, buf, offset, i);
									containsErrors = true;
								}
								buf = c;
								state = lexState.DOT;
								break;
							case lexState.DOT:
								this.appendSpan(node, lexState.SEPARATOR, buf, offset, i);
								buf = c;
								state = lexState.DOT;
								break;
							case lexState.WORD:
								if (lex.isThis(buf, lexType.KEYWORD)) {
									this.appendSpan(node, lexState.KEYWORD, buf, offset, i);
								} else {
									if (lex.isThis(buf, lexType.LITERAL)) {
										this.appendSpan(node, lexState.LITERAL, buf, offset, i);
									} else {
										this.appendSpan(node, lexState.IDENTIFIER, buf, offset, i);
									}
								}
								buf = c;
								state = lexState.DOT;
								break;
							case lexState.LITERAL:
								if (type == lexType.NUM_N) {
									buf += c;
									type = lexType.NUM_D;
								} else {
									this.appendSpan(node, lexState.LITERAL, buf, offset, i);
									buf = c;
									state = lexState.DOT;
								}
								break;
							case lexState.ERROR:
								this.appendSpan(node, lexState.ERROR, buf, offset, i);
								containsErrors = true;
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
								if (lex.isThis(buf, lexType.OPERATOR)) {
									this.appendSpan(node, lexState.OPERATOR, buf, offset, i);
								} else {
									this.appendSpan(node, lexState.ERROR, buf, offset, i);
									containsErrors = true;
								}
								buf = c;
								state = lexState.WORD;
								break;
							case lexState.DOT:
								this.appendSpan(node, lexState.SEPARATOR, buf, offset, i);
								buf = c;
								state = lexState.WORD;
								break;
							case lexState.WORD:
								buf += c;
								break;
							case lexState.LITERAL:
								if (type == lexType.NUM_HEX && this.isNumHex(c)) {
									buf += c;
								} else {
									if (char.isThis(c, charType.LETTER.LITERAL_LETTER)) {
										var correct = true;
										switch (c) {
											case 'L':
											case 'l':
												if (type == lexType.NUM_N || type == lexType.NUM_HEX) {
													buf += c;
													this.appendSpan(node, lexState.LITERAL, buf, offset, i);
													buf = '';
													state = lexState.EMPTY;
												} else {
													correct = false;
												}
												break;
											case 'E':
											case 'e':
												if (type == lexType.NUM_N || type == lexType.NUM_D_N) {
													type = lexType.NUM_E;
													buf += c;
												} else {
													correct = false;
												}
												break;
											case 'X':
											case 'x':
												if (buf[0] == '0' && buf.length == 1) {
													type = lexType.NUM_HEX;
													buf += c;
												} else {
													correct = false;
												}
												break;
											case 'B':
											case 'b':
												if (buf[0] == '0' && buf.length == 1) {
													type = lexType.NUM_BIN;
													buf += c;
												} else {
													correct = false;
												}
												break;
											case 'D':
											case 'd':
											case 'F':
											case 'f':
												if (type == lexType.NUM_D_N || type == lexType.NUM_E_N) {
													buf += c;
													this.appendSpan(node, lexState.LITERAL, buf, offset, i);
													buf = '';
													state = lexState.EMPTY;
												} else {
													correct = false;
												}
												break;
										}
										if (!correct) {
											//buf += c;
											this.appendSpan(node, lexState.LITERAL, buf, offset, i);
											buf = c;
											state = lexState.WORD;
										}
									} else {
										//buf += c;
										this.appendSpan(node, lexState.LITERAL, buf, offset, i);
										buf = c;
										state = lexState.WORD;

										//this.appendSpan(node, lexState.LITERAL, buf, offset, i);
										//buf = c;
										//state = lexState.WORD;
									}
								}
								break;
							case lexState.ERROR:
								this.appendSpan(node, lexState.ERROR, buf, offset, i);
								containsErrors = true;
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
								if (lex.isThis(buf, lexType.OPERATOR)) {
									this.appendSpan(node, lexState.OPERATOR, buf, offset, i);
								} else {
									this.appendSpan(node, lexState.ERROR, buf, offset, i);
									containsErrors = true;
								}
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
											if (!this.isNumOct(c)) {
												this.appendSpan(node, lexState.ERROR, buf, offset, i+1);
												containsErrors = true;
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
										if (!this.isNumBin(c)) {
											this.appendSpan(node, lexState.ERROR, buf, offset, i+1);
											containsErrors = true;
											buf = '';
											state = lexState.EMPTY;
										}
										break;
									case lexType.NUM_OCT:
										buf += c;
										if (!this.isNumOct(c)) {
											this.appendSpan(node, lexState.ERROR, buf, offset, i+1);
											containsErrors = true;
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
								this.appendSpan(node, lexState.ERROR, buf, offset, i);
								containsErrors = true;
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
								if (lex.isThis(buf, lexType.OPERATOR)) {
									this.appendSpan(node, lexState.OPERATOR, buf, offset, i);
								} else {
									this.appendSpan(node, lexState.ERROR, buf, offset, i);
									containsErrors = true;
								}
								buf = c;
								this.appendSpan(node, lexState.ERROR, buf, offset, i+1);
								containsErrors = true;
								buf = '';
								state = lexState.EMPTY;
								break;
							case lexState.DOT:
								this.appendSpan(node, lexState.SEPARATOR, buf, offset, i);
								buf = c;
								this.appendSpan(node, lexState.ERROR, buf, offset, i+1);
								containsErrors = true;
								buf = '';
								state = lexState.EMPTY;
								break;
							case lexState.WORD:
								if (lex.isThis(buf, lexType.KEYWORD)) {
									this.appendSpan(node, lexState.KEYWORD, buf, offset, i);
								} else {
									if (lex.isThis(buf, lexType.LITERAL)) {
										this.appendSpan(node, lexState.LITERAL, buf, offset, i);
									} else {
										this.appendSpan(node, lexState.IDENTIFIER, buf, offset, i);
									}
								}
								buf = c;
								this.appendSpan(node, lexState.ERROR, buf, offset, i+1);
								containsErrors = true;
								buf = '';
								state = lexState.EMPTY;
								break;
							case lexState.LITERAL:
								this.appendSpan(node, lexState.LITERAL, buf, offset, i);
								buf = c;
								this.appendSpan(node, lexState.ERROR, buf, offset, i+1);
								containsErrors = true;
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
							this.appendSpan(node, state, buf, offset, i+1);
							break;
						case lexState.STRING:
							this.appendSpan(node, lexState.STRING, buf, offset, i+1);
							break;
						case lexState.OPERATOR:
							if (lex.isThis(buf, lexType.OPERATOR)) {
								this.appendSpan(node, lexState.OPERATOR, buf, offset, i+1);
							} else {
								this.appendSpan(node, lexState.ERROR, buf, offset, i+1);
								containsErrors = true;
							}
							break;
						case lexState.DOT:
							this.appendSpan(node, lexState.SEPARATOR, buf, offset, i+1);
							break;
						case lexState.WORD:
							if (lex.isThis(buf, lexType.KEYWORD)) {
								this.appendSpan(node, lexState.KEYWORD, buf, offset, i+1);
							} else {
								if (lex.isThis(buf, lexType.LITERAL)) {
									this.appendSpan(node, lexState.LITERAL, buf, offset, i+1);
								} else {
									this.appendSpan(node, lexState.IDENTIFIER, buf, offset, i+1);
								}
							}
							break;
						case lexState.LITERAL:
							this.appendSpan(node, lexState.LITERAL, buf, offset, i+1);
							break;
						case lexState.ERROR:
							this.appendSpan(node, lexState.ERROR, buf, offset, i+1);
							containsErrors = true;
							break;
					}
				}
			}

			if (linesAdded || this.lines.numBeforeInput != this.lines.numAtInput) {
				this.markLines(node);
				document.getElementById(this.elementId.editorScroll).scrollLeft = 0;
			}
			this.updateLineErrorImg(node, containsErrors, containsWarnings);
		} else {
			console.log('Error - Editor - parseLine - node is not Line');
		}
	},
	/** Добавляет значок (ошибка/предупреждение) к линнии нумерации.
	 * @param {Element} numLine - Линия нумерации
	 * @param {string} img - Название значка (поле resources)
	*/
	addNumLineImg(numLine, img) {
		var resources = this.resources;
		if (resources[img] != null) {
			var numLineImg = document.createElement('img');
			numLineImg.className = this.css.numberLineImg;
			numLineImg.setAttribute('src', resources[img]);
			numLine.append(numLineImg);
		} else {
			var numLineImg = document.createElement('div');
			numLineImg.className = this.css.numberLineImg;
			if (img == 'errorImg') {
				numLineImg.innerHTML = '(x)';
				numLineImg.setAttribute('style', 'background-color: red;');
			} else {
				if (img == 'warningImg') {
					numLineImg.innerHTML = '(!)';
					numLineImg.setAttribute('style', 'background-color: orange;');
				}
			}
			numLine.append(numLineImg);
		}
	},
	/** Добавляет линию нумерации
	 * @param {Element} numberContainer - Контейнер для линий нумерации
	 * @param {Element} lineNode - Линия кода, для которой создается линия нумерации
	 * @param {number} cnt - Отображаемый порядковый номер
	*/
	appendNumLine(numberContainer, lineNode, cnt) {
		var classList = lineNode.classList;
		if (classList.contains(this.css.line)) {
			var numLine = document.createElement('div');
			numLine.className = this.css.numberLine;
			if (classList.contains(this.css.lineError))
				this.addNumLineImg(numLine, 'errorImg');
			else
				if (classList.contains(this.css.lineWarning))
					this.addNumLineImg(numLine, 'warningImg');
			var numLineNum = document.createElement('div');
			numLineNum.className = this.css.numberLineValue;
			numLineNum.innerHTML = cnt;
			numLine.append(numLineNum);
			numLine.id = lineNode.id + this.elementIdPostfix.numberLine;
			numberContainer.append(numLine);
		}
	},
	/** Выделяет линию
	 * @param {Element} node - Выделяемая линия
	*/
	selectLine(node) {
		var selectedLine = this.lines.selected;
		var selectedNumLine = null;
		if (selectedLine != null) {
			selectedNumLine = document.getElementById(selectedLine.id + this.elementIdPostfix.numberLine);
			selectedLine.classList.remove(this.css.lineActive);
			if (selectedNumLine != null)
				selectedNumLine.classList.remove(this.css.numberLineActive);
		}
		this.lines.selected = node;
		selectedNumLine = document.getElementById(node.id + this.elementIdPostfix.numberLine);
		this.lines.selected.classList.add(this.css.lineActive);
		if (selectedNumLine != null)
			selectedNumLine.classList.add(this.css.numberLineActive);
	},
	/** Перенумерация всех линий редактора (пересоздание линий нумерации, обновление id линий, вызывается
		при изменении количества линий). Текущая линия, при разборе которой был вызван метод, выделяется
	 * @param {Element} node - Текущая линия
	*/
	markLines(node) {
		var cnt = 0;
		var numberContainer = document.getElementById(this.elementId.numberContainer);
		numberContainer.innerHTML = '';
		var currentNode = node.parentNode.firstChild;
		while (currentNode != null) {
			cnt++;
			currentNode.id = this.elementId.editor + this.elementIdPostfix.line + cnt;
			this.appendNumLine(numberContainer, currentNode, cnt);
			currentNode = currentNode.nextSibling;
		}
		this.lines.cnt = cnt;
		this.selectLine(node);
	},
	/** Возвращает родительскую линию, внутри которой находится элемент node,
		если у node нет родительской линии, возвращает null
	 * @param {Element} node - Элемент
	 * @return {Element | null} Родительская линия элемента, или null если такой нет
	*/
	getLineNode(node) {
		var cssLine = this.css.line;
		while (!this.containsClass(node, cssLine)) {
			node = node.parentNode;
			if (node == null)
				return null;
		}
		return node;
	},
	/** Выделяет линию, на которой в данный момент находится текстовый указатель */
	checkLineActive() {
		var selection = document.getSelection();
		var node = this.getLineNode(selection.anchorNode);
		if (node != null)
			this.selectLine(node);
	},
	/** Вставляет текст в возицию текстового указателя, после вставки, парсит текст
	 * @param {string} text - Вставляемый текст
	*/
	enterTextInLine(text) {
		var selection = document.getSelection();
		var node = selection.anchorNode;
		var line = this.getLineNode(node);
		if (line != null) {
			var offset = selection.anchorOffset;
			var content = node.textContent.slice(0,offset) + text + node.textContent.slice(offset);
			node.textContent = content;
			this.setCursor(node, offset + text.length);
			this.parseLine(line);
		}
	},
	/** Устанавливает текстовый указатель, на указанную позицию
	 * @param {Element} node - Элемент, относительно которого устанавливается позиция
	 * @param {number} offset - Смещение позиции, относительно элемента node
	*/
	setCursor(node, offset) {
		var selection = document.getSelection();
		var range = new Range();
		range.setStart(node, offset);
		range.collapse(true);
		selection.removeAllRanges();
		selection.addRange(range);
	},
	/** Получает позицию текстового курсора, относительно указанного элемента
	 * @param {Element} node - Элемент, относительно которого вычисляется позиция
	*/
	getCursor(node) {
		var offset = 0;
		if (window.getSelection) {
			var range = window.getSelection().getRangeAt(0);
			var preCaretRange = range.cloneRange();
			preCaretRange.selectNodeContents(node);
			preCaretRange.setEnd(range.endContainer, range.endOffset);
			offset = preCaretRange.toString().length;
		}
		return offset;
	},
	/** Проверяет наличие класса className у элемента node,
		если класс имеется возвращает true, во всеех остальных случах false
	 * @param {Element} node - Проверяемый элемент
	 * @param {string} className - Название класса
	*/
	containsClass(node, className) {
		if (node == null || node.classList == null)
			return false;
		return node.classList.contains(className);
	}
}