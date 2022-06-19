let code =
	'public class HelloWorld {\n' +
		'\tpublic static void main(String[] args) {\n' +
			'\t\t//Вывод текста\n' +
			'\t\tSystem.out.println("Welcome to Java!");\n' +
			'\t\t//Длинный текст = @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n' +
		'\t}\n' +
	'}';

document.addEventListener("DOMContentLoaded", function() {
	editor.init('editor', 'java', code);
});