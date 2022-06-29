let code =
	'import org.zenframework.z8.base.table.Table;\n' +
	'import org.zenframework.z8.base.table.value.StringField;\n' +
	'\n' +
	'[entry]\n' +
	'[generatable]\n' +
	'[name "Library"]\n' +
	'[displayName "Библиотека"]\n' +
	'/** Таблица библиотеки\n' +
	' * @version 1.0\n' +
	' */\n' +
	'public class Library extends Table {\n' +
		'\t\n' +
		'\t//Наименование\n' +
		'\t[displayName "Наименование"] name;\n' +
		'\t\n' +
		'\t/*Поле для\n' +
		'\tхранения адреса*/\n' +
		'\t[name "Address"]\n' +
		'\t[displayName "Адрес"]\n' +
		'\tpublic StringField address;\n' +
		'\taddress.length = 100;\n' +
		'\t\n' +
	'}';

document.addEventListener("DOMContentLoaded", function() {
	editor.init('editor', blSyntax, code);
});