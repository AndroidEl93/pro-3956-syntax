var editor = {
	//Текущий выбранный синтаксис
	currentSyntax: null,
	//Данные для каждого синтаксиса
	syntax: {
		java: {
			separator: [' ', '\t', ';', '{', '}', '[', ']', '(', ')'],
			symbol: ['>', '<', '=', '+', '-', '/', '!', '&', '|', '*', '%', '$', '^', '~', ':', '?'],
			operator: ['=', '+', '-', '*', '/', '++', '--', '!', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '$=',
				'^=', '|=', ',', '%', '&', '|', '^', '~', ':', '?', '>>', '<<', '>>>', '<<=', '>>='],
			keyword: ['if', 'switch', 'case', 'default', 'break', 'continue', 'for', 'while', 'do', 'void', 'class', 'public',
				'private', 'static', 'final', 'String', 'int', 'boolean', 'float', 'double'],
			literal: ['true', 'false', 'null'],
			quotes: ['"'],
			literalLetters: ['X', 'x', 'B', 'b', 'D', 'd', 'F', 'f', 'L', 'l', 'E', 'e']
		}
	},
	//Типы символов
	charType: {
		C_LETTER: 1,
		C_NUM: 2,
		C_DOT: 3,
		C_LINE: 4,
		C_SEPARATOR: 5,
		C_SYMBOL: 6,
		C_UNDEFINED: 7,
		C_QUOTES: 8
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
		textContainer.addEventListener('paste', function(e) { e.preventDefault(); });
		textContainer.addEventListener('drop', function(e) { e.preventDefault(); });
		textContainer.addEventListener('beforeinput', function(e) {
			thisObj['lines']['numBeforeInput'] = textContainer.childNodes.length;
		});
		textContainer.addEventListener('input', function(e) {
			thisObj['lines']['numAtInput'] = textContainer.childNodes.length;
			var selection = document.getSelection();
			var line = thisObj.getLineNode(selection.anchorNode);
			if (line != null) {
				thisObj.parseLine(line);
			} else {
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
			if (e.keyCode >= 37 && e.keyCode <= 40) {
				thisObj.checkLineActive();
			}
		});
	},
	isLetter(c) {
		return (c.charCodeAt(0) >= 65 && c.charCodeAt(0) <= 90) ||
			(c.charCodeAt(0) >= 97 && c.charCodeAt(0) <= 122) || c.charAt(0) == '_';
	},
	isNum(c) {
		return c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 57;
	},
	isNumBin(c) {
		return c == '0' || c == '1';
	},
	isNumOct(c) {
		return c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 55;
	},
	isNumHex(c) {
		return (c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 57) ||
		(c.charCodeAt(0) >= 97 && c.charCodeAt(0) <= 102) ||
		(c.charCodeAt(0) >= 65 && c.charCodeAt(0) <= 70);
	},
	isThis(c, category) {
		var syntax = this.syntax;
		var currentSyntax = this.currentSyntax;
		var length = syntax[currentSyntax][category].length;
		for (var i = 0; i < length; i++) {
			if (c == syntax[currentSyntax][category][i]) return true;
		}
		return false;
	},
	/** Возвращает тип символа
	 * @param {string} c - Проверяемый символ
	 * @return {number} Возвращает значение типа символа (charType)
	*/
	getCharType(c) {
		if (this.isLetter(c)) return this.charType.C_LETTER;
		if (this.isNum(c)) return this.charType.C_NUM;
		if (c == '.') return this.charType.C_DOT;
		if (c == '\n') return this.charType.C_LINE;
		if (this.isThis(c, 'separator')) return this.charType.C_SEPARATOR;
		if (this.isThis(c, 'symbol')) return this.charType.C_SYMBOL;
		if (this.isThis(c, 'quotes')) return this.charType.C_QUOTES;
		return this.charType.C_UNDEFINED;
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
				if (numLineImg.length == 0) {
					this.addNumLineImg(numLine, 'errorImg');
				} else {
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
					if (numLineImg.length == 0) {
						this.addNumLineImg(numLine, 'warningImg');
					} else {
						numLineImg[0].remove();
						this.addNumLineImg(numLine, 'warningImg');
					}
				}
			} else {
				var numLine = document.getElementById(node.id + this.elementIdPostfix.numberLine);
				if (numLine != null) {
					var numLineImg = numLine.getElementsByClassName(this.css.numberLineImg);
					if (numLineImg.length > 0) {
						numLineImg[0].remove();
					}
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
	appendSpan(parentLine, className, content, lineOffset, endIndex) {
		var span = document.createElement('span');
		span.className = className;
		var text = document.createTextNode(content);
		span.append(text);
		parentLine.append(span);

		if (lineOffset != null) {
			var offset = content.length - (endIndex - lineOffset);
			if (offset <= content.length && offset >= 0) {
				this.setCursor(text, offset);
			}
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

			/* Состояние лексемы */
			var S_EMPTY = 0, S_OPERATOR = 1, S_DOT = 2, S_WORD = 3, S_LITERAL = 4, S_ERROR = 5, S_STRING = 6,
				S_COMMENT_INLINE = 7, S_COMMENT_BLOCK = 8;
			/* Тип-состояния лексемы (сейчас только числа: 0-не определен, 1-цифры без символов,
				2-цифры с точкой на конце, 3-цифры+точка+цифры, 4-цифры+буква Е (экспонента), 5-цифры+Е+знак(+ или -)
				6-цифры+Е(со знаками или без)+цифры, 7-hex число (начинается с 0х), 8-bin число (0b), 9-oct число (0) */
			var T_UNDEFINED = 0, T_NUM_N = 1, T_NUM_D = 2, T_NUM_D_N = 3, T_NUM_E = 4, T_NUM_E_S = 5, T_NUM_E_N = 6,
				T_NUM_HEX = 7, T_NUM_BIN = 8, T_NUM_OCT = 9;
			var type = T_UNDEFINED;
			var state = S_EMPTY;

			for (var i = 0; i < text.length; i++) {
				var c = text.charAt(i);

				//Далее в зависимости от текущего символа строки, состояния и типа текущей лексемы, делаем разбор
				switch (this.getCharType(c)) {
					case this.charType.C_LINE:
						switch (state) {
							case S_COMMENT_INLINE:
							case S_COMMENT_BLOCK:
								this.appendSpan(node, this.css.spanComment, buf, offset, i);
								break;
							case S_STRING:
								this.appendSpan(node, this.css.spanString, buf, offset, i);
								break;
							case S_OPERATOR:
								if (this.isThis(buf, 'operator')) {
									this.appendSpan(node, this.css.spanOperator, buf, offset, i);
								} else {
									this.appendSpan(node, this.css.spanError, buf, offset, i);
									containsErrors = true;
								}
								break;
							case S_DOT:
								this.appendSpan(node, this.css.spanSeparator, buf, offset, i);
								break;
							case S_WORD:
								if (this.isThis(buf, 'keyword')) {
									this.appendSpan(node, this.css.spanKeyword, buf, offset, i);
								} else {
									if (this.isThis(buf, 'literal')) {
										this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
									} else {
										this.appendSpan(node, this.css.spanIdentifiers, buf, offset, i);
									}
								}
								break;
							case S_LITERAL:
								this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
								break;
							case S_ERROR:
								this.appendSpan(node, this.css.spanError, buf, offset, i);
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
						state = S_EMPTY;
						break;
					case this.charType.C_SEPARATOR:
						switch (state) {
							case S_STRING:
							case S_COMMENT_INLINE:
							case S_COMMENT_BLOCK:
								buf += c;
								break;
							case S_EMPTY:
								this.appendSpan(node, this.css.spanSeparator, c, offset, i+1);
								buf = '';
								state = S_EMPTY;
								break;
							case S_OPERATOR:
								if (this.isThis(buf, 'operator')) {
									this.appendSpan(node, this.css.spanOperator, buf, offset, i);
								} else {
									this.appendSpan(node, this.css.spanError, buf, offset, i);
									containsErrors = true;
								}
								this.appendSpan(node, this.css.spanSeparator, c, offset, i+1);
								buf = '';
								state = S_EMPTY;
								break;
							case S_DOT:
								this.appendSpan(node, this.css.spanSeparator, buf, offset, i);
								this.appendSpan(node, this.css.spanSeparator, c, offset, i+1);
								buf = '';
								state = S_EMPTY;
								break;
							case S_WORD:
								if (this.isThis(buf, 'keyword')) {
									this.appendSpan(node, this.css.spanKeyword, buf, offset, i);
								} else {
									if (this.isThis(buf, 'literal')) {
										this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
									} else {
										this.appendSpan(node, this.css.spanIdentifiers, buf, offset, i);
									}
								}
								this.appendSpan(node, this.css.spanSeparator, c, offset, i+1);
								buf = '';
								state = S_EMPTY;
								break;
							case S_LITERAL:
								this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
								this.appendSpan(node, this.css.spanSeparator, c, offset, i+1);
								buf = '';
								state = S_EMPTY;
								break;
							case S_ERROR:
								this.appendSpan(node, this.css.spanError, buf, offset, i);
								containsErrors = true;
								this.appendSpan(node, this.css.spanSeparator, c, offset, i+1);
								buf = '';
								state = S_EMPTY;
								break;
						}
						break;
					case this.charType.C_QUOTES:
						switch (state) {
							case S_COMMENT_INLINE:
							case S_COMMENT_BLOCK:
								buf += c;
								break;
							case S_STRING:
								buf += c;
								this.appendSpan(node, this.css.spanString, buf, offset, i+1);
								buf = '';
								state = S_EMPTY;
								break;
							case S_EMPTY:
								buf += c;
								state = S_STRING;
								break;
							case S_OPERATOR:
								if (this.isThis(buf, 'operator')) {
									this.appendSpan(node, this.css.spanOperator, buf, offset, i);
								} else {
									this.appendSpan(node, this.css.spanError, buf, offset, i);
									containsErrors = true;
								}
								buf = c;
								state = S_STRING;
								break;
							case S_DOT:
								this.appendSpan(node, this.css.spanSeparator, buf, offset, i);
								buf = c;
								state = S_STRING;
								break;
							case S_WORD:
								if (this.isThis(buf, 'keyword')) {
									this.appendSpan(node, this.css.spanKeyword, buf, offset, i);
								} else {
									if (this.isThis(buf, 'literal')) {
										this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
									} else {
										this.appendSpan(node, this.css.spanIdentifiers, buf, offset, i);
									}
								}
								buf = c;
								state = S_STRING;
								break;
							case S_LITERAL:
								this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
								buf = c;
								state = S_STRING;
								break;
							case S_ERROR:
								this.appendSpan(node, this.css.spanError, buf, offset, i);
								containsErrors = true;
								buf = c;
								state = S_STRING;
								break;
						}
						break;
					case this.charType.C_SYMBOL:
						switch (state) {
							case S_STRING:
							case S_COMMENT_INLINE:
								buf += c;
								break;
							case S_COMMENT_BLOCK:
								buf += c;
								if (buf[buf.length-2] == '*' && buf[buf.length-1] == '/') {
									this.appendSpan(node, this.css.spanComment, buf, offset, i+1);
									buf = '';
									state = S_EMPTY;
								}
								break;
							case S_EMPTY:
							case S_OPERATOR:
								/* TODO  =//  Переделать немного */
								buf += c;
								if (buf[buf.length-2]  == '/' && buf[buf.length-1] == '/') {
									state = S_COMMENT_INLINE;
								} else {
									if (buf[buf.length-2] == '/' && buf[buf.length-1] == '*') {
										state = S_COMMENT_BLOCK;
									} else {
										state = S_OPERATOR;
									}
								}
								break;
							case S_DOT:
								this.appendSpan(node, this.css.spanSeparator, buf, offset, i);
								buf = c;
								state = S_OPERATOR;
								break;
							case S_WORD:
								if (this.isThis(buf, 'keyword')) {
									this.appendSpan(node, this.css.spanKeyword, buf, offset, i);
								} else {
									if (this.isThis(buf, 'literal')) {
										this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
									} else {
										this.appendSpan(node, this.css.spanIdentifiers, buf, offset, i);
									}
								}
								buf = c;
								state = S_OPERATOR;
								break;
							case S_LITERAL:
								if (type == T_NUM_E && (c == '+' || c == '-')) {
									buf += c;
									type = T_NUM_E_S;
								} else {
									this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
									buf = c;
									state = S_OPERATOR;
								}
								break;
							case S_ERROR:
								this.appendSpan(node, this.css.spanError, buf, offset, i);
								containsErrors = true;
								buf = c;
								state = S_OPERATOR;
								break;
						}
						break;
					case this.charType.C_DOT:
						switch (state) {
							case S_STRING:
							case S_COMMENT_INLINE:
							case S_COMMENT_BLOCK:
								buf += c;
								break;
							case S_EMPTY:
								buf += c;
								state = S_DOT;
								break;
							case S_OPERATOR:
								if (this.isThis(buf, 'operator')) {
									this.appendSpan(node, this.css.spanOperator, buf, offset, i);
								} else {
									this.appendSpan(node, this.css.spanError, buf, offset, i);
									containsErrors = true;
								}
								buf = c;
								state = S_DOT;
								break;
							case S_DOT:
								this.appendSpan(node, this.css.spanSeparator, buf, offset, i);
								buf = c;
								state = S_DOT;
								break;
							case S_WORD:
								if (this.isThis(buf, 'keyword')) {
									this.appendSpan(node, this.css.spanKeyword, buf, offset, i);
								} else {
									if (this.isThis(buf, 'literal')) {
										this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
									} else {
										this.appendSpan(node, this.css.spanIdentifiers, buf, offset, i);
									}
								}
								buf = c;
								state = S_DOT;
								break;
							case S_LITERAL:
								if (type == T_NUM_N) {
									buf += c;
									type = T_NUM_D;
								} else {
									this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
									buf = c;
									state = S_DOT;
								}
								break;
							case S_ERROR:
								this.appendSpan(node, this.css.spanError, buf, offset, i);
								containsErrors = true;
								buf = c;
								state = S_DOT;
								break;
						}
						break;
					case this.charType.C_LETTER:
						switch (state) {
							case S_STRING:
							case S_COMMENT_INLINE:
							case S_COMMENT_BLOCK:
								buf += c;
								break;
							case S_EMPTY:
								buf += c;
								state = S_WORD;
								break;
							case S_OPERATOR:
								if (this.isThis(buf, 'operator')) {
									this.appendSpan(node, this.css.spanOperator, buf, offset, i);
								} else {
									this.appendSpan(node, this.css.spanError, buf, offset, i);
									containsErrors = true;
								}
								buf = c;
								state = S_WORD;
								break;
							case S_DOT:
								this.appendSpan(node, this.css.spanSeparator, buf, offset, i);
								buf = c;
								state = S_WORD;
								break;
							case S_WORD:
								buf += c;
								break;
							case S_LITERAL:
								if (type == T_NUM_HEX && this.isNumHex(c)) {
									buf += c;
								} else {
									if (this.isThis(c, 'literalLetters')) {
										var correct = true;
										switch (c) {
											case 'L':
											case 'l':
												if (type == T_NUM_N || type == T_NUM_HEX) {
													buf += c;
													this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
													buf = '';
													state = S_EMPTY;
												} else {
													correct = false;
												}
												break;
											case 'E':
											case 'e':
												if (type == T_NUM_N || type == T_NUM_D_N) {
													type = T_NUM_E;
													buf += c;
												} else {
													correct = false;
												}
												break;
											case 'X':
											case 'x':
												if (buf[0] == '0' && buf.length == 1) {
													type = T_NUM_HEX;
													buf += c;
												} else {
													correct = false;
												}
												break;
											case 'B':
											case 'b':
												if (buf[0] == '0' && buf.length == 1) {
													type = T_NUM_BIN;
													buf += c;
												} else {
													correct = false;
												}
												break;
											case 'D':
											case 'd':
											case 'F':
											case 'f':
												if (type == T_NUM_D_N || type == T_NUM_E_N) {
													buf += c;
													this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
													buf = '';
													state = S_EMPTY;
												} else {
													correct = false;
												}
												break;
										}
										if (!correct) {
											//buf += c;
											this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
											buf = c;
											state = S_WORD;
										}
									} else {
										//buf += c;
										this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
										buf = c;
										state = S_WORD;

										//this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
										//buf = c;
										//state = S_WORD;
									}
								}
								break;
							case S_ERROR:
								this.appendSpan(node, this.css.spanError, buf, offset, i);
								containsErrors = true;
								buf = c;
								state = S_WORD;
								break;
						}
						break;
					case this.charType.C_NUM:
						switch (state) {
							case S_STRING:
							case S_COMMENT_INLINE:
							case S_COMMENT_BLOCK:
								buf += c;
								break;
							case S_EMPTY:
								buf += c;
								state = S_LITERAL;
								type = T_NUM_N;
								break;
							case S_OPERATOR:
								if (this.isThis(buf, 'operator')) {
									this.appendSpan(node, this.css.spanOperator, buf, offset, i);
								} else {
									this.appendSpan(node, this.css.spanError, buf, offset, i);
									containsErrors = true;
								}
								buf = c;
								state = S_LITERAL;
								type = T_NUM_N;
								break;
							case S_DOT:
								buf += c;
								state = S_LITERAL;
								type = T_NUM_N;
								break;
							case S_WORD:
								buf += c;
								state = S_WORD;
								break;
							case S_LITERAL:
								switch (type) {
									case T_NUM_D:
										type = T_NUM_D_N;
										buf += c;
										break;
									case T_NUM_N:
										buf += c;
										if (buf.length == 1 && buf[0] == '0') {
											type = T_NUM_OCT;
											if (!this.isNumOct(c)) {
												this.appendSpan(node, this.css.spanError, buf, offset, i+1);
												containsErrors = true;
												buf = '';
												state = S_EMPTY;
											}
										}
										break;
									case T_NUM_D_N:
									case T_NUM_HEX:
									case T_NUM_E_N:
										buf += c;
										break;
									case T_NUM_BIN:
										buf += c;
										if (!this.isNumBin(c)) {
											this.appendSpan(node, this.css.spanError, buf, offset, i+1);
											containsErrors = true;
											buf = '';
											state = S_EMPTY;
										}
										break;
									case T_NUM_OCT:
										buf += c;
										if (!this.isNumOct(c)) {
											this.appendSpan(node, this.css.spanError, buf, offset, i+1);
											containsErrors = true;
											buf = '';
											state = S_EMPTY;
										}
										break;
									case T_NUM_E:
									case T_NUM_E_S:
										type = T_NUM_E_N;
										buf += c;
										break;
								}
								break;
							case S_ERROR:
								this.appendSpan(node, this.css.spanError, buf, offset, i);
								containsErrors = true;
								buf = c;
								state = S_LITERAL;
								type = T_NUM_N;
								break;
						}
						break;
					case this.charType.C_UNDEFINED:
						switch (state) {
							case S_STRING:
							case S_COMMENT_INLINE:
							case S_COMMENT_BLOCK:
								buf += c;
								break;
							case S_EMPTY:
								buf += c;
								state = S_ERROR;
								break;
							case S_OPERATOR:
								if (this.isThis(buf, 'operator')) {
									this.appendSpan(node, this.css.spanOperator, buf, offset, i);
								} else {
									this.appendSpan(node, this.css.spanError, buf, offset, i);
									containsErrors = true;
								}
								buf = c;
								this.appendSpan(node, this.css.spanError, buf, offset, i+1);
								containsErrors = true;
								buf = '';
								state = S_EMPTY;
								break;
							case S_DOT:
								this.appendSpan(node, this.css.spanSeparator, buf, offset, i);
								buf = c;
								this.appendSpan(node, this.css.spanError, buf, offset, i+1);
								containsErrors = true;
								buf = '';
								state = S_EMPTY;
								break;
							case S_WORD:
								if (this.isThis(buf, 'keyword')) {
									this.appendSpan(node, this.css.spanKeyword, buf, offset, i);
								} else {
									if (this.isThis(buf, 'literal')) {
										this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
									} else {
										this.appendSpan(node, this.css.spanIdentifiers, buf, offset, i);
									}
								}
								buf = c;
								this.appendSpan(node, this.css.spanError, buf, offset, i+1);
								containsErrors = true;
								buf = '';
								state = S_EMPTY;
								break;
							case S_LITERAL:
								this.appendSpan(node, this.css.spanLiteral, buf, offset, i);
								buf = c;
								this.appendSpan(node, this.css.spanError, buf, offset, i+1);
								containsErrors = true;
								buf = '';
								state = S_EMPTY;
								break;
							case S_ERROR:
								buf += c;
								break;
						}
						break;
				}

				if (i == text.length-1 && buf.length > 0) {
					switch (state) {
						case S_COMMENT_INLINE:
						case S_COMMENT_BLOCK:
							this.appendSpan(node, this.css.spanComment, buf, offset, i+1);
							break;
						case S_STRING:
							this.appendSpan(node, this.css.spanString, buf, offset, i+1);
							break;
						case S_OPERATOR:
							if (this.isThis(buf, 'operator')) {
								this.appendSpan(node, this.css.spanOperator, buf, offset, i+1);
							} else {
								this.appendSpan(node, this.css.spanError, buf, offset, i+1);
								containsErrors = true;
							}
							break;
						case S_DOT:
							this.appendSpan(node, this.css.spanSeparator, buf, offset, i+1);
							break;
						case S_WORD:
							if (this.isThis(buf, 'keyword')) {
								this.appendSpan(node, this.css.spanKeyword, buf, offset, i+1);
							} else {
								if (this.isThis(buf, 'literal')) {
									this.appendSpan(node, this.css.spanLiteral, buf, offset, i+1);
								} else {
									this.appendSpan(node, this.css.spanIdentifiers, buf, offset, i+1);
								}
							}
							break;
						case S_LITERAL:
							this.appendSpan(node, this.css.spanLiteral, buf, offset, i+1);
							break;
						case S_ERROR:
							this.appendSpan(node, this.css.spanError, buf, offset, i+1);
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