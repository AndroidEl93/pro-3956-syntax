let code =
	'import org.zenframework.z8.base.table.Table;\n' +
	'import org.zenframework.z8.base.table.value.StringField;\n' +
	'\n' +
	'\n' +
	'/** Таблица "Библиотека"\n' +
	' * @autor Взял пример из вебинара по z8 :)\n' +
	' * @version 1.0\n' +
	' */\n' +
	'[entry]\n' +
	'[generatable]\n' +
	'[name "Library"]\n' +
	'[displayName "Библиотека"]\n' +
	'public class Library extends Table {\n' +
		'\t\n' +
		'\t//Наименование\n' +
		'\t[displayName "Наименование"] name;\n' +
		'\t\n' +
		'\t/*\n' +
		'\t//Поле для хранения адреса\n' +
		'\t[name "Address"]\n' +
		'\t[displayName "Адрес"]\n' +
		'\tpublic StringField address;\n' +
		'\taddress.length = 100;\n' +
		'\t*/\n' +
		'\t\n' +
	'}';

document.addEventListener("DOMContentLoaded", function() {
	editor.init('editor', blSyntax, code);
});