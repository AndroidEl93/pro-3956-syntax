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
		numberLine: 'num-line',
		numberLineActive: 'num-line-active',
		numberLineLabel: 'num-line-lbl',
		numberLineLabelImg: 'num-line-lbl-img',
		numberLineValue: 'num-line-val',
		spanError: 'er',
		spanWarning: 'wr',
		spanComment: 'c',
		spanString: 's',
		spanOperator: 'o',
		spanSeparator: 'sp',
		spanKeyword: 'k',
		spanIdentifiers: 'i',
		spanLiteral: 'l',
		spanAttribute: 'a',
		spanType: 't',
		spanDoc: 'd',
		spanDocDescriptor: 'dd',
		spanType: 't',
		spanEscapeChar: 'e'
	},
	//Список описаний ошибок
	errors: {
		1: 'Нет закрывающих кавычек',
		11: 'Неверная запись восьмеричного числа',
		12: 'Неверная запись двоичного числа',
		13: 'Недопустимые символы'
	},
	//Список описаний предупреждений
	warnings: {
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
		selected: null
	},
	/** Граничные состояния лексем для линий. Объект нужен для отображения многострочных лексем (многострочный
	 * комментарий, документация). Формат данных - id: {start: lexState, end: lexState}, где id - id элемента линии,
	 * start - начальное состояние лексемы, с которого начинается парсинг линии, end - конечное состояние,
	 * lexState - объект состояния лексемы */
	linesBorderStates: {},





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
		//Добавляем объект MutationObserver, наблюдающий за состоянием линий редактора
		this.addObserver(textContainer);
		//Добавление пустой линии с начальным текстом
		var line = this.addLineAfterNode(null);
		line.innerHTML = text;
		textContainer.focus();
		//Парсим линию
		this.parseLine(line);
		//Обработчики событий редактора
		var thisObj = this;
		textContainer.addEventListener('paste', function(e) {
			e.preventDefault();
			var text = e.clipboardData.getData('text/plain');
			thisObj.enterTextInLine(text);
			thisObj.scrollToCursor({block: "nearest", inline: "end"});
		});
		textContainer.addEventListener('dragstart', function(e) {
			e.preventDefault();
		});
		textContainer.addEventListener('drop', function(e) {
			e.preventDefault();
		});
		textContainer.addEventListener('input', function(e) {
			var selection = document.getSelection();
			var line = thisObj.getLineNode(selection.anchorNode);
			if (line != null)
				thisObj.parseLine(line);
			else {
				textContainer.innerHTML = '';
				var newLine = thisObj.addLineAfterNode(null);
				textContainer.focus();
				thisObj.setCursor(newLine,0);
			}
		});
		textContainer.addEventListener('keydown', function(e) {
			if (e.keyCode == 9) {
				thisObj.enterTextInLine('\t');
				thisObj.scrollToCursor({block: "nearest", inline: "end"});
				e.preventDefault();
			}
			if (e.keyCode == 13) {
				thisObj.enterTextInLine('\n', -1);
				thisObj.scrollToCursor({block: "nearest", inline: "end"});
				e.preventDefault();
			}
			if (e.ctrlKey && (e.key == 'z' || e.key == 'Z' || e.key == 'я' || e.key == 'Я')) {
				e.preventDefault();
			  }
		}, false);
		document.addEventListener("selectionchange", function () {
			thisObj.checkLineActive();
		});
	},
	/** Добавляет к контейнеру объект наблюдатель (MutationObserver), наблюдающий за состоянием его дочерних узлов
	 * @param {Element} container - Контейнер
	*/
	addObserver(container) {
		var thisObj = this;
		//Создаем наболюдатель с callback функцией, срабатывающей при изменении дочерних узлов
		var observer = new MutationObserver(function(mutationRecords) {
			//Функция возвращает массив изменений, mutationRecords, проходимся по нему
			for (var i = 0; i < mutationRecords.length; i++) {
				//Текущий объект изменения
				var mutationRecord = mutationRecords[i];
				//В объекте изменения содержится массив удаленных узлов (removedNodes), пустой если не было удалений
				//Проходимся по удаленным узлам (линиям), если они есть, и удаляем принадлежащие им
				//линии нумерации и объект граничных состояний лексем
				for (var j = 0; j < mutationRecord.removedNodes.length; j++) {
					var numberContainer = document.getElementById(thisObj.elementId.numberContainer);
					var removedLine = mutationRecord.removedNodes.item(j);
					delete thisObj.linesBorderStates[removedLine.id];
					var removedLineNumLine = document.getElementById(removedLine.id +
						thisObj.elementIdPostfix.numberLine);
					if (removedLineNumLine != null)
						removedLineNumLine.remove();
				}
				//Если убавлялись или добавлялись линии, перенумеровываем линии нумерации
				if (mutationRecord.removedNodes.length > 0 || mutationRecord.addedNodes.length > 0)
					thisObj.numberLines(mutationRecord.previousSibling);
			}
		});
		//Прикрепляем наблюдатель к контейнеру, с параметрами - реагировать на изменения только дочерних узлов (линий)
		observer.observe(container, {
			childList: true,
			subtree: false
		});
	},
	/** Пронумеровывает линии нумерации, начиная с prevNode (не включая его) до конца (prevNode, lastChild]
	 * @param {Element} prevNode - Элемент, начиная с которого (не включая его) идет нумерация
	*/
	numberLines(prevNode) {
		var currentNumLine = (prevNode == null) ?
			document.getElementById(this.elementId.numberContainer).firstChild :
			document.getElementById(prevNode.id + this.elementIdPostfix.numberLine);
		var cnt = (prevNode == null) ?
			1 :
			Number(currentNumLine.getElementsByClassName(this.css.numberLineValue)[0].textContent);
		while (currentNumLine != null) {
			currentNumLine.getElementsByClassName(this.css.numberLineValue)[0].textContent = cnt;
			cnt++;
			currentNumLine = currentNumLine.nextSibling;
		}
	},
	/** Добавляет узел-линию после указанного узла. Если узел не указан или null, то в конец редактора. Возвращает
	 * добавленную линию. Так же создает для нее линию нумерации и объект граничных состояний лексем
	 * @param {Element|null} [node = null] - Если указан узел, то добавляет линию после него,
	 * если значение не указано или null, добавляет в конец текстового редактора
	 * @return {Element} - Добалвенная линия
	*/
	addLineAfterNode(node = null) {
		var newLine = document.createElement('div');
		newLine.className = this.css.line;
		var newLineId = this.elementId.editor + this.elementIdPostfix.line + this.lines.cnt;
		this.lines.cnt++;
		newLine.id = newLineId;

		this.linesBorderStates[newLineId] = {start: null, end: null};
		var numberContainer = document.getElementById(this.elementId.numberContainer);
		var newNumLine = document.createElement('div');
		newNumLine.id = newLineId + this.elementIdPostfix.numberLine;
		newNumLine.className = this.css.numberLine;
			var newNumLineVal = document.createElement('div');
			newNumLineVal.className = this.css.numberLineValue;
			newNumLine.append(newNumLineVal);
			var newNumLineLabel = document.createElement('div');
			newNumLineLabel.className = this.css.numberLineLabel;
			newNumLine.append(newNumLineLabel);

		if (node != null)  {
			var nodeNextSibling = node.nextSibling;
			if (nodeNextSibling != null) {
				var nodeNextSiblingNumLine = document.getElementById(nodeNextSibling.id +
					this.elementIdPostfix.numberLine);
				numberContainer.insertBefore(newNumLine, nodeNextSiblingNumLine);
				node.parentNode.insertBefore(newLine, nodeNextSibling);
			} else {
				numberContainer.append(newNumLine);
				node.parentNode.append(newLine);
			}
		} else {
			numberContainer.append(newNumLine);
			document.getElementById(this.elementId.textContainer).append(newLine);
		}

		return newLine;
	},
	/** Добавляет значок (изображение или текст) к метке линии
	 * @param {Element} label - Метка линии
	 * @param {string} img - Название добавляемого значка (this.resources)
	*/
	addLineLabelContent(label, img) {
		if (this.resources[img] != null) {
			var labelInner = label.getElementsByTagName('IMG');
			if (labelInner.length > 0)
				labelInner = labelInner[0];
			else {
				labelInner = document.createElement('IMG');
				labelInner.className = this.css.numberLineLabelImg;
				label.append(labelInner);
			}
			labelInner.setAttribute('src', this.resources.errorImg);
		} else {
			var labelInner = label.getElementsByTagName('SPAN');
			if (labelInner.length > 0)
				labelInner = labelInner[0];
			else {
				labelInner = document.createElement('SPAN');
				label.append(labelInner);
			}
			if (img == 'errorImg') {
				labelInner.innerHTML = '(x)';
				labelInner.setAttribute('style', 'background-color: red;');
			}
			if (img == 'warningImg') {
				numLineImg.innerHTML = '(!)';
				numLineImg.setAttribute('style', 'background-color: orange;');
			}
		}
	},
	/** Обновляет метку ошибки/предупреждения для указанной линии
	 * @param {Element} node - Линия
	 * @param {boolean} containsErrors - Наличие ошибок на линии
	 * @param {boolean} containsWarnings - Наличие предупреждений на линии
	*/
	updateLineLabel(node, containsErrors, containsWarnings) {
		var numLine = document.getElementById(node.id + this.elementIdPostfix.numberLine);
		if (numLine != null) {
			var numLineLabel = numLine.getElementsByClassName(this.css.numberLineLabel)[0];
			if (containsErrors)
				this.addLineLabelContent(numLineLabel, 'errorImg');
			else
				if (containsWarnings)
					this.addLineLabelContent(numLineLabel, 'warningImg');
				else
					numLineLabel.innerHTML = '';
		}
	},
	/** Добавляет спан к указаной линии и задает стиль.
	 * @param {Element} parentLine - Линия, внутри которой размещается спан
	 * @param {object} lex - Объект состояния лексемы (syntax.lex.state)
	 * @param {string} content - Содержимое спана
	 * @param {object|null} [param = null] - Дополнительые параметры спана (стили ошибок, всплывающая подсказка
	*/
	appendSpan(parentLine, lex, content, param = null) {
		var span = document.createElement('span');
		span.classList.add(this.css[lex.style]);
		var text = document.createTextNode(content);
		span.append(text);
		parentLine.append(span);
		if (param != null) {
			if (param.warning)
				span.classList.add(this.css.spanWarning);
			if (param.error)
				span.classList.add(this.css.spanError);
			if (param.title != null)
				span.setAttribute('title', param.title);
		}
	},
	/** Прокручивает окно до текстового указателя
	 * @param {object} param - Объект с параметрами прокрутки (scrollIntoViewOptions)
	*/
	scrollToCursor(param) {
		var tmpAnchor = document.createElement('span');
		var selection = window.getSelection();
		var range = selection.getRangeAt(0);
		range.insertNode(tmpAnchor);
		tmpAnchor.scrollIntoView(param);
		tmpAnchor.remove();
	},
	/** Парсит содержимое линии (или текст из параметра src) на лексемы, оборачивая их в стилизованые спаны.
	 *		Если содержимое содержит переводы строк, создает дополнителньые линии
	 * @param {Element} node - Разбираемая линия
	 * @param {string|null} [src = null] - Если параметр указан, то метод парсит указанный текст,
	 * 		если не указан или null, берет текст из содержимого линии
	 * @param {number|null|-1|-2} [offset = null] - Смещение текстового указателя в символах (считается с конца линии).
	 *		Если не указан или null, вычисляет текущее смещение внутри линии, если -1, то указатель в начале линии.
	 *		Если -2, то не трогаем указатель. Указанное смещение будет установленно на текущей линии
	 *		после ее парсинга (если в ходе парсинга будут созданы новые линии, смещение будет установленно
	 *		на последней созданной линии)
	 * @param {object | null} [startState = null] - Состояние лексемы с которого начинается парсинг линии
	 * @param {object | null} [multilineEndState = null] - Параметр для хранения конечного состояния
	 *		лексемы изначальной линии, необходим для случая когда метод добавляет к изначальной линии дополнительные
	 *		и они должны помнить какой лексемой она заканчивалась (нужно для отображения многострочных лексем)
	*/
	parseLine(node, src = null, offset = null, startState = null, multilineEndState = null) {
		if (this.containsClass(node, this.css.line)) {
			var lexState = this.syntax.lex.state;
			//Были ли найдены ошибки и предупреждения в ходе работы метода
			var containsErrors = false;
			var containsWarnings = false;
			//Смещение текстового указателя, берется из передаваемого параметра или вычисляется
			var currentOffset = offset;
			if (currentOffset == null) {
				//Определяем смещение текстового указателя внутри линии
				currentOffset = this.getCursorFromEnd(node);
			}
			//Текст для парсинга берется из src или содержимого линии
			var text = src;
			if (text == null) {
				text = node.textContent;
				node.innerHTML = "";
			}

			//Проверяем текст на наличие переводов строк, если таковой будет найден, запоминаем первую найденную позицию
			var textLength = text.length;
			var nPos = null;
			for (var i = 0; i < textLength; i++) {
				if (text.charAt(i) == '\n') {
					nPos = i;
					break;
				}
			}

			//Состояние граничных лексем линии
			var borderStates = this.linesBorderStates[node.id];

			//Определяемся с какой лексемы начинается парсинг и какой он заканчивался раньше
			var currentEndState = borderStates.end;;
			var currentStartState = startState;
			if (currentStartState == null) {
				currentStartState = borderStates.start;
			} else {
				borderStates.start = currentStartState;
			}

			//В переменной будет храниться результат парсинга текста
			var parseResult;

			/* Если в тексте был найден перевод строки, парсим в текущую линию текст до перевода,
				добавляем новую линию и передаем ей остальной текст. */
			if (nPos != null) {
				var currentMultilineEndState = null;
				if (multilineEndState == null) {//Первая в серии
					currentMultilineEndState = currentEndState;
				} else {//Серединная
					currentMultilineEndState = multilineEndState;
				}
				parseResult = this.syntax.parseText(text.slice(0, nPos), currentStartState);
				var resultState = parseResult[1];
				borderStates.end = resultState;
				var newLine = this.addLineAfterNode(node);
				this.parseLine(newLine, text.slice(nPos+1, text.length), offset, resultState, currentMultilineEndState);
			} else {
				if (multilineEndState != null) {//Последняя в серии
					currentEndState = multilineEndState;
				} //else - Единственная

				parseResult = this.syntax.parseText(text, currentStartState);
				var resultState = parseResult[1];
				borderStates.end = resultState;

				//Если линия заканчивается не той лексемой что раньше, перепарсиваем следующую за ней линию
				if (resultState != currentEndState) {
					var nextSibling = node.nextSibling;
					if (nextSibling != null) {

						this.parseLine(nextSibling, null, -2, resultState, null);
					}
				}
			}

			//Получаем массим лексем из результатов парсинга
			var lex = parseResult[0];
			//В цикле перебираем все лексемы, оборачиваем их в стилизованные спаны, и добавляем к текущей линии
			var length = lex.length;
			for (var i = 0; i < length; i++) {
				var lexAttr = lex[i].attr;
				var param = null;
				if (lexAttr != null) {
					if (lexAttr.error != null) {
						containsErrors = true;
						param = {
							error: true,
							title: this.errors[lexAttr.error]
						};
					}
					if (lexAttr.warning != null) {
						containsWarnings = true;
						param = {
							warning: true,
							title: this.warnings[lexAttr.warning]
						};
					}
				}
				this.appendSpan(node, lex[i].state, lex[i].text, param);
			}

			//Обновляем значки ошибок в линии нумерации
			this.updateLineLabel(node, containsErrors, containsWarnings);

			//Если в изначальном тексте не было переводов на новую строку, т.е. эта линия последняя или единственная
			//Перемещаем текстовый указатель на нужное место, на этой линии
			if (nPos == null && currentOffset >= -1) {
				if (currentOffset == -1) {
					this.setCursor(node, 0);
				} else {
					this.setLineCursorFromEnd(node, currentOffset);
				}
			}
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
	 * @param {number|null|-1} [setOffset = null] - Позиция текстового указателя (с конца строки), на которую он
	 *		будет установлен после вставки текста, если не задано или null - вычислит позицию до ставки,
	 *		если = -1, установит в начало строки
	*/
	enterTextInLine(text, setOffset = null) {
		var selection = document.getSelection();
		var node = selection.anchorNode;
		var line = this.getLineNode(node);
		if (line != null) {
			var prevOffset = setOffset;
			if (prevOffset == null) {
				prevOffset = this.getCursorFromEnd(line);
			}
			var offset = selection.anchorOffset;
			var content = node.textContent.slice(0,offset) + text + node.textContent.slice(offset);
			node.textContent = content;
			this.parseLine(line, null, prevOffset);
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
	/** Устанавливает текстовый указатель, на указанную позицию (с конца содержимого, на символьный
	 *		индекс = offset, элемента node)
	 * @param {Element} node - Элемент, внутри которого устанавливается указатель
	 * @param {number} offset - Индекс символа (с конца содержимого), на который будет помещен указатель
	*/
	setLineCursorFromEnd(node, offset) {
		var searchNode = function(start, node, offset) {
			var currentNode = node.lastChild;
			var cnt = start;
			while (currentNode != null) {
				var length = currentNode.textContent.length;
				if (offset >= cnt && offset <= cnt + length) {
					if (currentNode.nodeType == Node.TEXT_NODE) {
						var selection = document.getSelection();
						var range = new Range();
						range.setStart(currentNode, length - (offset - start));
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
				currentNode = currentNode.previousSibling;
			}
		};
		searchNode(0, node, offset);
	},
	/** Получает позицию текстового указателя (с конца содержимого), относительно указанного элемента
	 * @param {Element} node - Элемент, относительно которого вычисляется позиция
	*/
	getCursorFromEnd(node) {
		var offset = 0;
		if (window.getSelection) {
			var range = window.getSelection().getRangeAt(0);
			var preCaretRange = range.cloneRange();
			preCaretRange.selectNodeContents(node);
			preCaretRange.setStart(range.endContainer, range.endOffset);
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
