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
				e.preventDefault();
			}
			if (e.keyCode == 13) {
				thisObj.enterTextInLine('\n');
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
				//Проходимся по удаленным узлам (линиям), если они есть, и удаляем принадлежащие им линии нумерации
				for (var j = 0; j < mutationRecord.removedNodes.length; j++) {
					var numberContainer = document.getElementById(thisObj.elementId.numberContainer);
					var removedLine = mutationRecord.removedNodes.item(j);
					var removedLineNumLine = document.getElementById(removedLine.id +
						thisObj.elementIdPostfix.numberLine);
					if (removedLineNumLine != null)
						removedLineNumLine.remove();
				}
				//Если убавлялись или добавлялись линии, перенумеровываем строки нумерации
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
	 * добавленную линию
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
		if (this.containsClass(node, this.css.line)) {
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
						this.updateLineLabel(node, containsErrors, containsWarnings);
						//Сбрасываем метку наличия ошибки
						containsErrors = false;
						//Добавляем новую линию после текущей
						var newLine = this.addLineAfterNode(node);
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
			//Если была добавлена линия, скролим по горизонтали в начало
			if (linesAdded)
				document.getElementById(this.elementId.editorScroll).scrollLeft = 0;
			//Обновляем значки ошибок в строке нумерации
			this.updateLineLabel(node, containsErrors, containsWarnings);
			//Если не было сброса указателя, ставим его на место, если был, то ставим в 0 позицию
			if (offset != null)
				this.setLineCursor(node, offset);
			else
				this.setCursor(node,0);
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
