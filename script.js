document.addEventListener('DOMContentLoaded', function() {
    const parser = window.ArxivQueryParser;
    const fieldOptions = [
        { value: 'ti', label: 'Title' },
        { value: 'au', label: 'Author' },
        { value: 'abs', label: 'Abstract' },
        { value: 'co', label: 'Comment' },
        { value: 'jr', label: 'Journal Reference' },
        { value: 'cat', label: 'Category' },
        { value: 'all', label: 'All Fields' }
    ];

    const searchTermsContainer = document.getElementById('search-terms');
    const addTermButton = document.getElementById('add-term');
    const addGroupButton = document.getElementById('add-group');
    const termConnector = document.getElementById('term-connector');
    const importInput = document.getElementById('import-query');
    const importButton = document.getElementById('import-query-button');
    const importStatus = document.getElementById('import-status');
    const sortByInput = document.getElementById('sort-by');
    const sortOrderInput = document.getElementById('sort-order');
    const maxResultsInput = document.getElementById('max-results');
    const generateUrlButton = document.getElementById('generate-url');
    const resultUrl = document.getElementById('result-url');
    const queryPreview = document.getElementById('query-preview');
    const copyUrlButton = document.getElementById('copy-url');

    addTermButton.addEventListener('click', function() {
        const activeGroup = getActiveGroup();
        addSearchTerm(activeGroup);
    });

    addGroupButton.addEventListener('click', function() {
        const activeGroup = getActiveGroup();
        addTermGroup(activeGroup);
    });

    importButton.addEventListener('click', handleImport);
    generateUrlButton.addEventListener('click', generateUrl);
    copyUrlButton.addEventListener('click', copyToClipboard);

    searchTermsContainer.addEventListener('click', function(event) {
        const removeTermButton = event.target.closest('.remove-term');
        if (removeTermButton) {
            event.stopPropagation();
            removeTerm(removeTermButton.closest('.search-term'));
            return;
        }

        const removeGroupButton = event.target.closest('.remove-group');
        if (removeGroupButton) {
            event.stopPropagation();
            removeGroup(removeGroupButton.closest('.term-group'));
            return;
        }

        if (
            event.target.classList.contains('term-group') ||
            event.target.classList.contains('group-controls') ||
            event.target.classList.contains('group-indicator')
        ) {
            updateGroupSelection(event.target.closest('.term-group') || searchTermsContainer);
        }
    });

    searchTermsContainer.addEventListener('input', updateQueryPreview);
    searchTermsContainer.addEventListener('change', updateQueryPreview);

    updateGroupSelection(searchTermsContainer);
    updateQueryPreview();

    function getFieldOptionsMarkup(selectedValue) {
        return fieldOptions.map(function(option) {
            const selected = option.value === selectedValue ? ' selected' : '';
            return `<option value="${option.value}"${selected}>${option.label}</option>`;
        }).join('');
    }

    function createConnectorElement(connector) {
        const connectorElement = document.createElement('div');
        connectorElement.className = 'connector-label';
        connectorElement.textContent = connector;
        return connectorElement;
    }

    function createTermElement(field, value) {
        const term = document.createElement('div');
        term.className = 'search-term';
        term.innerHTML = `
            <select class="field-selector">
                ${getFieldOptionsMarkup(field || 'ti')}
            </select>
            <input type="text" class="term-input" placeholder="Enter search term" value="${escapeAttribute(value || '')}">
            <div class="term-actions">
                <button class="remove-term" title="Remove term">✕</button>
            </div>
        `;
        return term;
    }

    function createGroupElement(isRoot) {
        const group = document.createElement('div');
        group.className = 'term-group';

        const actionsMarkup = isRoot ? '' : `
            <div class="group-actions">
                <button class="remove-group" title="Remove group">✕</button>
            </div>
        `;

        group.innerHTML = `
            <div class="group-controls">
                <span class="group-indicator">Group</span>
                ${actionsMarkup}
            </div>
        `;

        if (isRoot) {
            group.id = 'search-terms';
        }

        return group;
    }

    function escapeAttribute(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function getActiveGroup() {
        return document.querySelector('.term-group.active') || searchTermsContainer;
    }

    function getDirectQueryItems(group) {
        return Array.from(group.children).filter(function(element) {
            return !element.classList.contains('group-controls');
        });
    }

    function appendQueryItem(group, item, connector) {
        if (getDirectQueryItems(group).length > 0) {
            group.appendChild(createConnectorElement(connector || termConnector.value));
        }

        group.appendChild(item);
        updateGroupSelection(group);
    }

    function addSearchTerm(group, config) {
        const term = createTermElement(
            config && config.field,
            config && config.value
        );
        appendQueryItem(group, term, config && config.connector);
    }

    function addTermGroup(parentGroup, config) {
        const group = createGroupElement(false);
        appendQueryItem(parentGroup, group, config && config.connector);

        if (config && config.items && config.items.length > 0) {
            populateGroupFromAst(group, config);
        } else {
            addSearchTerm(group);
        }

        updateGroupSelection(group);
    }

    function clearGroup(group) {
        getDirectQueryItems(group).forEach(function(item) {
            item.remove();
        });
    }

    function populateGroupFromAst(groupElement, groupAst) {
        clearGroup(groupElement);

        groupAst.items.forEach(function(item, index) {
            const connector = index > 0 ? groupAst.connectors[index - 1] : null;

            if (item.type === 'term') {
                addSearchTerm(groupElement, {
                    field: item.field,
                    value: item.value,
                    connector: connector
                });
                return;
            }

            addTermGroup(groupElement, {
                items: item.items,
                connectors: item.connectors,
                connector: connector
            });
        });
    }

    function renderImportedAst(ast) {
        populateGroupFromAst(searchTermsContainer, ast);
        updateGroupSelection(searchTermsContainer);
        updateQueryPreview();
    }

    function removeItemAndConnector(item) {
        if (!item) {
            return;
        }

        const previousElement = item.previousElementSibling;
        const nextElement = item.nextElementSibling;

        if (previousElement && previousElement.classList.contains('connector-label')) {
            previousElement.remove();
        } else if (nextElement && nextElement.classList.contains('connector-label')) {
            nextElement.remove();
        }

        item.remove();
    }

    function removeTerm(term) {
        const parentGroup = term.closest('.term-group');
        removeItemAndConnector(term);
        checkForEmptyGroup(parentGroup);
        updateQueryPreview();
    }

    function removeGroup(group) {
        if (group === searchTermsContainer) {
            return;
        }

        const parentGroup = group.parentElement.closest('.term-group');
        const wasActive = group.classList.contains('active');
        removeItemAndConnector(group);

        if (parentGroup) {
            checkForEmptyGroup(parentGroup);
            if (wasActive) {
                updateGroupSelection(parentGroup);
            }
        }

        updateQueryPreview();
    }

    function checkForEmptyGroup(group) {
        if (!group) {
            return;
        }

        const directItems = getDirectQueryItems(group);

        if (directItems.length > 0) {
            return;
        }

        if (group === searchTermsContainer) {
            addSearchTerm(group);
            return;
        }

        const parentGroup = group.parentElement.closest('.term-group');
        removeItemAndConnector(group);

        if (parentGroup) {
            checkForEmptyGroup(parentGroup);
        }
    }

    function updateGroupSelection(group) {
        document.querySelectorAll('.term-group').forEach(function(currentGroup) {
            currentGroup.classList.remove('active');
        });

        group.classList.add('active');
    }

    function formatTermValue(value) {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return '';
        }

        if (/^".*"$/.test(trimmedValue)) {
            return trimmedValue;
        }

        return /\s/.test(trimmedValue) ? `"${trimmedValue}"` : trimmedValue;
    }

    function buildQueryFromGroup(group) {
        const items = getDirectQueryItems(group);
        const queryParts = [];
        let connector = 'AND';

        items.forEach(function(item) {
            if (item.classList.contains('connector-label')) {
                connector = item.textContent;
                return;
            }

            let part = '';

            if (item.classList.contains('search-term')) {
                const field = item.querySelector('.field-selector').value;
                const value = item.querySelector('.term-input').value.trim();

                if (value) {
                    part = `${field}:${formatTermValue(value)}`;
                }
            }

            if (item.classList.contains('term-group')) {
                const innerQuery = buildQueryFromGroup(item);
                if (innerQuery) {
                    part = `(${innerQuery})`;
                }
            }

            if (!part) {
                return;
            }

            if (queryParts.length > 0) {
                queryParts.push(connector);
            }

            queryParts.push(part);
        });

        return queryParts.join(' ');
    }

    function updateQueryPreview() {
        const query = buildQueryFromGroup(searchTermsContainer);
        queryPreview.textContent = query || 'No query terms defined';
    }

    function applyImportedOptions(options) {
        if (options.sortBy) {
            sortByInput.value = options.sortBy;
        }

        if (options.sortOrder) {
            sortOrderInput.value = options.sortOrder;
        }

        if (options.maxResults) {
            maxResultsInput.value = options.maxResults;
        }
    }

    function setImportStatus(message, type) {
        importStatus.textContent = message;
        importStatus.className = `import-status ${type}`;
    }

    function handleImport() {
        const input = importInput.value;

        try {
            const imported = parser.parseImportedContent(input);
            renderImportedAst(imported.ast);
            applyImportedOptions(imported.options);
            setImportStatus('Imported successfully. You can keep editing the visual groups below.', 'success');
        } catch (error) {
            setImportStatus(error.message, 'error');
        }
    }

    function generateUrl() {
        const baseUrl = 'https://export.arxiv.org/api/query';
        const searchQuery = buildQueryFromGroup(searchTermsContainer);
        const params = new URLSearchParams();

        if (searchQuery) {
            params.append('search_query', searchQuery);
        }

        params.append('sortBy', sortByInput.value);
        params.append('sortOrder', sortOrderInput.value);
        params.append('start', '0');
        params.append('max_results', maxResultsInput.value);

        resultUrl.textContent = `${baseUrl}?${params.toString()}`;
        updateQueryPreview();
        document.querySelector('.result-container').style.display = 'block';
    }

    function copyToClipboard() {
        const text = resultUrl.textContent;

        if (!text) {
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(showCopiedState, fallbackCopy);
            return;
        }

        fallbackCopy();

        function fallbackCopy() {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showCopiedState();
        }
    }

    function showCopiedState() {
        const originalText = copyUrlButton.textContent;
        copyUrlButton.textContent = 'Copied!';
        setTimeout(function() {
            copyUrlButton.textContent = originalText;
        }, 2000);
    }
});
