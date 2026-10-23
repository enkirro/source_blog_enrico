/* Code blocks: adds a bar with the language and a copy button.

   The language comes from the code card's language field in the editor
   (Ghost renders it as class="language-…"). Blocks marked as "console" or
   "shell-session" are treated as terminal transcripts: only the lines that
   start with "$ " are copied, without the prompt, so command output shown
   in a tutorial never ends up pasted into someone's shell. */
(function () {
    var blocks = document.querySelectorAll('.gh-content pre');
    if (!blocks.length) return;

    var strings = Object.assign({
        copy: 'Copy',
        copied: 'Copied',
        copyCode: 'Copy code',
        copyFailed: 'Could not copy',
    }, window.themeStrings || {});

    var LANGUAGE_NAMES = {
        sh: 'bash',
        shell: 'bash',
        zsh: 'zsh',
        ps: 'powershell',
        ps1: 'powershell',
        pwsh: 'powershell',
        yml: 'yaml',
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        tf: 'terraform',
        'shell-session': 'console',
        plaintext: '',
        text: '',
        txt: '',
    };

    var TRANSCRIPT_LANGUAGES = ['console', 'shell-session'];

    var ICON_COPY = '<svg class="is-idle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path stroke-linecap="round" stroke-linejoin="round" d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"></path></svg>';
    var ICON_DONE = '<svg class="is-done" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>';

    function getLanguage(code) {
        var match = (code.className || '').match(/(?:^|\s)lang(?:uage)?-([\w+#.-]+)/i);
        return match ? match[1].toLowerCase() : '';
    }

    function getText(code, language) {
        var text = code.textContent.replace(/\n$/, '');

        if (TRANSCRIPT_LANGUAGES.indexOf(language) > -1) {
            var commands = text.split('\n')
                .filter(function (line) {
                    return /^\$ /.test(line);
                })
                .map(function (line) {
                    return line.slice(2);
                });

            if (commands.length) return commands.join('\n');
        }

        return text;
    }

    /* The old copy API: still works where the Clipboard API is missing (plain
       HTTP) or refused (some embedded browsers and webviews deny it) */
    function legacyCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        var ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (e) {}
        document.body.removeChild(textarea);
        return ok ? Promise.resolve() : Promise.reject();
    }

    function copy(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).catch(function () {
                return legacyCopy(text);
            });
        }

        return legacyCopy(text);
    }

    blocks.forEach(function (pre) {
        var code = pre.querySelector('code') || pre;
        var language = getLanguage(code);
        var label = language in LANGUAGE_NAMES ? LANGUAGE_NAMES[language] : language;

        var wrapper = document.createElement('div');
        wrapper.className = 'gh-code';

        var bar = document.createElement('div');
        bar.className = 'gh-code-bar';

        if (label) {
            var lang = document.createElement('span');
            lang.className = 'gh-code-lang';
            lang.textContent = label;
            bar.appendChild(lang);
        }

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'gh-code-copy';
        button.setAttribute('aria-label', strings.copyCode);
        button.innerHTML = ICON_COPY + ICON_DONE;

        var buttonText = document.createElement('span');
        buttonText.textContent = strings.copy;
        button.appendChild(buttonText);

        var status = document.createElement('span');
        status.className = 'gh-visually-hidden';
        status.setAttribute('role', 'status');

        bar.appendChild(button);
        bar.appendChild(status);

        var timer;

        button.addEventListener('click', function () {
            copy(getText(code, language)).then(function () {
                button.classList.add('is-copied');
                buttonText.textContent = strings.copied;
                status.textContent = strings.copied;
            }, function () {
                buttonText.textContent = strings.copyFailed;
                status.textContent = strings.copyFailed;
            }).then(function () {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    button.classList.remove('is-copied');
                    buttonText.textContent = strings.copy;
                    status.textContent = '';
                }, 2000);
            });
        });

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(bar);
        wrapper.appendChild(pre);
    });
})();
