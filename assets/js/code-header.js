/**
 * Code Block Header Injection (Replaces broken Liquid Logic)
 */
document.addEventListener('DOMContentLoaded', function () {
    const codeBlocks = document.querySelectorAll('div.highlighter-rouge');

    if (codeBlocks.length === 0) return;

    const languageMap = {
        'actionscript': 'ActionScript',
        'as': 'ActionScript',
        'as3': 'ActionScript',
        'applescript': 'AppleScript',
        'bash': 'Shell',
        'sh': 'Shell',
        'zsh': 'Shell',
        'cpp': 'C++',
        'c': 'C',
        'cs': 'C#',
        'csharp': 'C#',
        'css': 'CSS',
        'coffeescript': 'CoffeeScript',
        'dockerfile': 'Dockerfile',
        'go': 'Go',
        'golang': 'Go',
        'html': 'HTML',
        'java': 'Java',
        'javascript': 'JavaScript',
        'js': 'JavaScript',
        'json': 'JSON',
        'kotlin': 'Kotlin',
        'kt': 'Kotlin',
        'latex': 'LaTeX',
        'lua': 'Lua',
        'markdown': 'Markdown',
        'md': 'Markdown',
        'matlab': 'Matlab',
        'objc': 'Objective-C',
        'objective-c': 'Objective-C',
        'php': 'PHP',
        'perl': 'Perl',
        'pl': 'Perl',
        'python': 'Python',
        'py': 'Python',
        'r': 'R',
        'ruby': 'Ruby',
        'rb': 'Ruby',
        'rust': 'Rust',
        'rs': 'Rust',
        'scala': 'Scala',
        'scss': 'SCSS',
        'sql': 'SQL',
        'swift': 'Swift',
        'typescript': 'TypeScript',
        'ts': 'TypeScript',
        'vb': 'Visual Basic',
        'visualbasic': 'Visual Basic',
        'xml': 'XML',
        'yaml': 'YAML',
        'yml': 'YAML'
    };

    const copySucceedTitle = document.documentElement.getAttribute('data-copy-succeed-title') || 'Copied!';

    codeBlocks.forEach(block => {
        // Check if header already exists (prevent duplicate)
        if (block.querySelector('.code-header')) return;

        // Get language class
        let lang = '';
        const classes = block.className.split(' ');
        for (const cls of classes) {
            if (cls.startsWith('language-')) {
                lang = cls.replace('language-', '');
                break;
            }
        }

        if (!lang) return; // No language detected

        // Map language to display name
        let label = languageMap[lang.toLowerCase()];
        if (!label) {
            label = lang.charAt(0).toUpperCase() + lang.slice(1);
        }

        // Icon
        let iconClass = 'fas fa-code small';
        if (block.hasAttribute('file')) {
            iconClass = 'far fa-file-code';
            const fileAttr = block.getAttribute('file');
            if (fileAttr) label = fileAttr;
        }

        // Create Header HTML
        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `
      <span data-label-text="${label}">
        <i class="${iconClass}"></i>
      </span>
      <button aria-label="copy" data-title-succeed="${copySucceedTitle}">
        <i class="far fa-clipboard"></i>
      </button>
    `;

        // Insert before the highlight container
        // Structure: <div class="language-xyz..."><div class="highlight">...</div></div>
        // We want to insert 'header' inside the outer div, BEFORE the inner 'highlight' div.
        const highlightDiv = block.querySelector('.highlight');
        if (highlightDiv) {
            block.insertBefore(header, highlightDiv);
        } else {
            // Fallback if no .highlight div (e.g. simple pre)
            block.prepend(header);
        }
    });
});
