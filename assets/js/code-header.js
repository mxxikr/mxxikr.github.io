/**
 * Code Block Header Injection + Cleanup
 */
document.addEventListener('DOMContentLoaded', function () {
    const codeBlocks = document.querySelectorAll('div.highlighter-rouge');

    if (codeBlocks.length === 0) return;

    const languageMap = {
        'actionscript': 'ActionScript', 'as': 'ActionScript', 'as3': 'ActionScript',
        'applescript': 'AppleScript',
        'bash': 'Shell', 'sh': 'Shell', 'zsh': 'Shell',
        'cpp': 'C++', 'c': 'C',
        'cs': 'C#', 'csharp': 'C#',
        'css': 'CSS',
        'coffeescript': 'CoffeeScript',
        'dockerfile': 'Dockerfile',
        'go': 'Go', 'golang': 'Go',
        'html': 'HTML',
        'java': 'Java',
        'javascript': 'JavaScript', 'js': 'JavaScript',
        'json': 'JSON',
        'kotlin': 'Kotlin', 'kt': 'Kotlin',
        'latex': 'LaTeX',
        'lua': 'Lua',
        'markdown': 'Markdown', 'md': 'Markdown',
        'matlab': 'Matlab',
        'objc': 'Objective-C', 'objective-c': 'Objective-C',
        'php': 'PHP',
        'perl': 'Perl', 'pl': 'Perl',
        'python': 'Python', 'py': 'Python',
        'r': 'R',
        'ruby': 'Ruby', 'rb': 'Ruby',
        'rust': 'Rust', 'rs': 'Rust',
        'scala': 'Scala',
        'scss': 'SCSS',
        'sql': 'SQL',
        'swift': 'Swift',
        'typescript': 'TypeScript', 'ts': 'TypeScript',
        'vb': 'Visual Basic', 'visualbasic': 'Visual Basic',
        'xml': 'XML',
        'yaml': 'YAML', 'yml': 'YAML'
    };

    const copySucceedTitle = 'Copied!';

    codeBlocks.forEach(block => {
        // Check if header already exists
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

        if (!lang) return;

        // Map language to display name
        let label = languageMap[lang.toLowerCase()];
        if (!label) {
            label = lang.charAt(0).toUpperCase() + lang.slice(1);
        }

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

        // Add copy functionality
        const copyButton = header.querySelector('button');
        copyButton.addEventListener('click', function () {
            const highlightDiv = block.querySelector('.highlight');
            if (!highlightDiv) return;

            // Find the code content
            const codeElement = highlightDiv.querySelector('pre code, .rouge-code pre, code');
            if (!codeElement) return;

            // Get text content
            const code = codeElement.textContent || codeElement.innerText;

            // Copy to clipboard
            navigator.clipboard.writeText(code).then(() => {
                // Visual feedback
                const originalIcon = copyButton.querySelector('i');
                originalIcon.className = 'fas fa-check';
                copyButton.classList.add('copied');

                setTimeout(() => {
                    originalIcon.className = 'far fa-clipboard';
                    copyButton.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = code;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);

                const originalIcon = copyButton.querySelector('i');
                originalIcon.className = 'fas fa-check';
                setTimeout(() => {
                    originalIcon.className = 'far fa-clipboard';
                }, 2000);
            });
        });

        // Insert header
        const highlightDiv = block.querySelector('.highlight');
        if (highlightDiv) {
            block.insertBefore(header, highlightDiv);
        } else {
            block.prepend(header);
        }
    });
});
