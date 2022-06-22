var editor = {
	/** Объект содержит информацию по используемому синтаксису, 
	 * и методы для работы с ним. Задается при инициализации (this.init()) */
	syntax: null,
	/** Названия стилей, используемых в редакторе */
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
	/** Id основных элементов */
	elementId: {},
	/** Постфиксы основных элементов, для генерации id */
	elementIdPostfix: {
		editorScroll: '-s',
		numberContainer: '-num',
		textContainer: '-text',
		navigationContainer: '-nav',
		line: '-l-',
		numberLine: '-n'
	},
	/** Адреса ресурсов, используемых в редакторе */
	resources: {
		errorImg: 'img/er.png',
		warningImg: 'img/wr.png'
	},
	/** Переменные для работы с линиями */
	lines: {
		cnt: 0,
		numBeforeInput: 0,
		numAtInput: 0,
		selected: null
	},





	/** Инициализация редактора
	 * @param {string} containerId - Id контейнера, в котором будет размещен редактор
	 * @param {object} syntax - Объект используемого синтаксиса
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
		//Установка используемого синтаксиса
		this.syntax = syntax;
		//Создание пустой линии, с начальным текстом
		var line = document.createElement('div');
		line.classList.add(this.css.line);
		line.innerHTML = text;
		textContainer.append(line);
		textContainer.focus();
		//Парсим линию
		this.parseLine(line);
		//Обработчики событий редактора
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
	 * @param {boolean} containsErrors - Наличие ошибок на линии
	 * @param {boolean} containsWarnings - Наличие предупреждений на линии
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
	/** Добавляет спан к указаной линии и задает стиль.
	 * @param {Element} parentLine - Линия, внутри которой размещается спан
	 * @param {object} lex - Объект состояния лексемы (syntax.lex.state)
	 * @param {string} content - Содержимое спана
	*/
	appendSpan(parentLine, lex, content) {
		var span = document.createElement('span');
		span.className = this.css[lex.style];
		var text = document.createTextNode(content);
		span.append(text);
		parentLine.append(span);
	},
	/** Парсит содержимое линии на лексемы, оборачивая их в стилизованые спаны
	 * @param {Element} node - Разбираемая линия
	*/
	parseLine(node) {
		var timeMark = (new Date).getTime();
		if (this.containsClass(node, this.css.line)) {
			//Очищаем линию от классов ошибок
			node.classList.remove(this.css.lineError, this.css.lineWarning);
			//Определяем смещение текстового указателя внутри линии
			var offset = this.getCursor(node);
			//Были ли добавлены новые линии в ходе работы метода
			var linesAdded = false;
			//Были ли найдены ошибки и предупреждения в ходе работы метода
			var containsErrors = false;
			var containsWarnings = false;
			//Парсим текст линии, получая массив лексем, очищаем линию
			var lex = this.syntax.parseText(node.textContent);
			node.innerHTML = "";
			//Пробегаемся по всем лексемам линии
			var lexState = this.syntax.lex.state;
			var length = lex.length;
			for (var i = 0; i < length; i++) {
				switch (lex[i].state) {
					case lexState.LINE: //Если лексема - перевод строки (LINE)...
						//Обновляем значки ошибок в строке нумерации
						this.updateLineErrorImg(node, containsErrors, containsWarnings);
						//Сбрасываем метку наличия ошибки
						containsErrors = false;
						//Добавляем новую линию после текущей
						var newLine = document.createElement('div');
						newLine.className = this.css.line;
						if (node.nextSibling != null)
							node.parentNode.insertBefore(newLine,node.nextSibling);
						else
							node.parentNode.append(newLine);
						//Делаем новую линию текущей
						node = newLine;
						//Помечаем что была добалвенна новая линия
						linesAdded = true;
						//Сбрасываем смещение текстового указателя
						offset = null;
					break;
					case lexState.ERROR: //Если лексема содержит ошибку (ERROR), делаем пометку что найдена ошибка...
						containsErrors = true;
						//Проваливаемся ниже, в default...
					default: //Для всех остальных лексем...
						//Оборачиваем лексему в спан и добавляем к текущей линии
						this.appendSpan(node, lex[i].state, lex[i].text);
					break;
				}
			}
			//Если была добавлена новая линия или в редакторе, тем или иным образом, изменилось число линий
			if (linesAdded || this.lines.numBeforeInput != this.lines.numAtInput) {
				//Перенумеровываем линии и скролим редактор по горизонтали в начало
				this.markLines(node);
				document.getElementById(this.elementId.editorScroll).scrollLeft = 0;
			}
			//Обновляем значки ошибок в строке нумерации
			this.updateLineErrorImg(node, containsErrors, containsWarnings);
			//Если не было сброса указателя, ставим его на место, если был, то ставим в 0 позицию
			if (offset != null)
				this.setLineCursor(node, offset);
			else
				this.setCursor(node,0);
		} else
			console.log('Error - Editor - parseLine - node is not Line');
		console.log('ParseLine time = '+((new Date).getTime() - timeMark));
	},
	/** Добавляет значок (ошибка/предупреждение) к линнии нумерации.
	 * @param {Element} numLine - Линия нумерации
	 * @param {string} img - Название значка (this.resources)
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
	/** Вставляет текст в возицию текстового указателя, после вставки, парсит линию
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
	/** Устанавливает текстовый указатель, на указанную позицию (offset - сдвиг, отностиельно элемента node)
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
	/** Устанавливает текстовый указатель, на указанную позицию (на символьный индекс = offset, элемента node)
	 * @param {Element} node - Элемент, внутри которого устанавливается указатель
	 * @param {number} offset - Индекс символа, на который будет помещен указатель
	*/
	setLineCursor(node, offset) {
		var searchNode = function(start, node, offset) {
			var currentNode = node.firstChild;
			var cnt = start;
			while (currentNode != null) {
				var length = currentNode.textContent.length;
				if (offset >= cnt && offset <= cnt + length) {
					if (currentNode.nodeType == Node.TEXT_NODE) {
						var selection = document.getSelection();
						var range = new Range();
						range.setStart(currentNode, offset - start);
						range.collapse(true);
						selection.removeAllRanges();
						selection.addRange(range);
						return;
					} else {
						searchNode(cnt, currentNode, offset);
						return;
					}
				}
				cnt += length;
				currentNode = currentNode.nextSibling;
			}
		};
		searchNode(0, node, offset);
	},
	/** Получает позицию текстового указателя, относительно указанного элемента
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
		если класс имеется, возвращает true, во всеех остальных случах false
	 * @param {Element} node - Проверяемый элемент
	 * @param {string} className - Название класса
	*/
	containsClass(node, className) {
		if (node == null || node.classList == null)
			return false;
		return node.classList.contains(className);
	}
}
