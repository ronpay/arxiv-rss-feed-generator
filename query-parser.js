(function(root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.ArxivQueryParser = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function() {
    const ALLOWED_FIELDS = new Set(['ti', 'au', 'abs', 'co', 'jr', 'cat', 'all']);
    const ALLOWED_SORT_BY = new Set(['relevance', 'lastUpdatedDate', 'submittedDate']);
    const ALLOWED_SORT_ORDER = new Set(['ascending', 'descending']);

    function normalizeImportedInput(input) {
        let normalized = String(input || '').trim();

        while (/""[^"]+""/.test(normalized)) {
            normalized = normalized.replace(/""([^"]+)""/g, '"$1"');
        }

        return normalized;
    }

    function parseImportedContent(rawInput) {
        const normalizedInput = normalizeImportedInput(rawInput);

        if (!normalizedInput) {
            throw new Error('Paste a query structure or an arXiv RSS/API URL.');
        }

        const extracted = extractImportPayload(normalizedInput);
        const ast = parseQueryStructure(extracted.searchQuery);

        return {
            ast,
            query: serializeAst(ast),
            options: extracted.options,
            sourceType: extracted.sourceType
        };
    }

    function extractImportPayload(input) {
        if (/^https?:\/\//i.test(input)) {
            const url = new URL(input);
            return {
                searchQuery: getSearchQueryFromParams(url.searchParams),
                options: extractOptions(url.searchParams),
                sourceType: 'url'
            };
        }

        if (/^\??search_query=/.test(input) || /^sortBy=/.test(input) || /^sortOrder=/.test(input) || /^max_results=/.test(input)) {
            const params = new URLSearchParams(input.replace(/^\?/, ''));
            return {
                searchQuery: getSearchQueryFromParams(params),
                options: extractOptions(params),
                sourceType: 'querystring'
            };
        }

        return {
            searchQuery: input,
            options: {},
            sourceType: 'query'
        };
    }

    function getSearchQueryFromParams(params) {
        const searchQuery = normalizeImportedInput(params.get('search_query'));

        if (!searchQuery) {
            throw new Error('The provided URL does not contain a search_query parameter.');
        }

        return searchQuery;
    }

    function extractOptions(params) {
        const options = {};
        const sortBy = params.get('sortBy');
        const sortOrder = params.get('sortOrder');
        const maxResults = params.get('max_results');

        if (ALLOWED_SORT_BY.has(sortBy)) {
            options.sortBy = sortBy;
        }

        if (ALLOWED_SORT_ORDER.has(sortOrder)) {
            options.sortOrder = sortOrder;
        }

        if (maxResults && /^\d+$/.test(maxResults)) {
            options.maxResults = maxResults;
        }

        return options;
    }

    function parseQueryStructure(input) {
        const parser = createParser(input);
        const ast = parser.parseSequence(null);
        parser.skipWhitespace();

        if (!parser.isAtEnd()) {
            throw new Error(`Unexpected token near "${parser.remainingSnippet()}".`);
        }

        return ast;
    }

    function createParser(input) {
        let index = 0;

        function skipWhitespace() {
            while (index < input.length && /\s/.test(input[index])) {
                index += 1;
            }
        }

        function isAtEnd() {
            return index >= input.length;
        }

        function remainingSnippet() {
            return input.slice(index, index + 20);
        }

        function peek() {
            return input[index];
        }

        function consume(char) {
            if (input[index] !== char) {
                throw new Error(`Expected "${char}" near "${remainingSnippet()}".`);
            }

            index += 1;
        }

        function parseSequence(inheritedField) {
            const items = [];
            const connectors = [];

            skipWhitespace();

            while (!isAtEnd() && peek() !== ')') {
                const item = parseItem(inheritedField);
                items.push(item);
                skipWhitespace();

                if (peek() === ')') {
                    break;
                }

                if (isAtEnd()) {
                    break;
                }

                connectors.push(parseOperator());
                skipWhitespace();

                if (isAtEnd() || peek() === ')') {
                    throw new Error('Boolean operators must have a term or group on both sides.');
                }
            }

            if (items.length === 0) {
                throw new Error('Groups cannot be empty.');
            }

            return {
                type: 'group',
                items,
                connectors
            };
        }

        function parseItem(inheritedField) {
            skipWhitespace();

            if (isAtEnd()) {
                throw new Error('Unexpected end of query.');
            }

            if (peek() === '(') {
                consume('(');
                const group = parseSequence(inheritedField);
                skipWhitespace();

                if (peek() !== ')') {
                    throw new Error('Missing closing parenthesis.');
                }

                consume(')');
                return group;
            }

            const field = parseFieldPrefix();

            if (field) {
                skipWhitespace();

                if (peek() === '(') {
                    consume('(');
                    const group = parseSequence(field);
                    skipWhitespace();

                    if (peek() !== ')') {
                        throw new Error('Missing closing parenthesis.');
                    }

                    consume(')');
                    return group;
                }

                return {
                    type: 'term',
                    field,
                    value: parseValue()
                };
            }

            if (!inheritedField) {
                throw new Error(`Expected a field prefix near "${remainingSnippet()}".`);
            }

            return {
                type: 'term',
                field: inheritedField,
                value: parseValue()
            };
        }

        function parseFieldPrefix() {
            const rest = input.slice(index);
            const match = rest.match(/^([A-Za-z][A-Za-z0-9]*):/);

            if (!match) {
                return null;
            }

            const field = match[1];
            const nextValueStart = rest.slice(match[0].length).trimStart();

            if (!ALLOWED_FIELDS.has(field)) {
                if (nextValueStart.startsWith('[')) {
                    throw new Error('Range queries are not supported by the visual builder yet.');
                }

                throw new Error(`Unsupported field prefix "${field}:".`);
            }

            index += match[0].length;
            return field;
        }

        function parseOperator() {
            const rest = input.slice(index);
            const match = rest.match(/^(ANDNOT|AND|OR)(?=\s|\(|"|[A-Za-z]|\)|$)/);

            if (!match) {
                throw new Error(`Expected AND, OR, or ANDNOT near "${remainingSnippet()}".`);
            }

            index += match[1].length;
            return match[1];
        }

        function parseValue() {
            skipWhitespace();

            if (isAtEnd()) {
                throw new Error('Missing term value.');
            }

            if (peek() === '[') {
                throw new Error('Range queries are not supported by the visual builder yet.');
            }

            if (peek() === '"') {
                return parseQuotedValue();
            }

            const start = index;

            while (!isAtEnd()) {
                const char = peek();

                if (char === '(' || char === ')' || /\s/.test(char)) {
                    break;
                }

                index += 1;
            }

            const value = input.slice(start, index).trim();

            if (!value) {
                throw new Error(`Missing term value near "${remainingSnippet()}".`);
            }

            if (ALLOWED_FIELDS.has(value)) {
                throw new Error(`Missing ":" after field prefix "${value}".`);
            }

            return value;
        }

        function parseQuotedValue() {
            consume('"');
            const start = index;

            while (!isAtEnd() && peek() !== '"') {
                index += 1;
            }

            if (isAtEnd()) {
                throw new Error('Unterminated double quote in search query.');
            }

            const value = input.slice(start, index);
            consume('"');
            return value;
        }

        return {
            skipWhitespace,
            isAtEnd,
            remainingSnippet,
            parseSequence
        };
    }

    function serializeAst(node) {
        if (node.type === 'term') {
            return `${node.field}:${formatTermValue(node.value)}`;
        }

        return node.items.map(function(item, index) {
            const serializedItem = item.type === 'group'
                ? `(${serializeAst(item)})`
                : serializeAst(item);

            if (index === 0) {
                return serializedItem;
            }

            return `${node.connectors[index - 1]} ${serializedItem}`;
        }).join(' ');
    }

    function formatTermValue(value) {
        if (/\s/.test(value)) {
            return `"${value}"`;
        }

        return value;
    }

    return {
        ALLOWED_FIELDS: Array.from(ALLOWED_FIELDS),
        parseImportedContent,
        parseQueryStructure,
        serializeAst,
        formatTermValue,
        normalizeImportedInput
    };
}));
