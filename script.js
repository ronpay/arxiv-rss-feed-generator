document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const searchTermsContainer = document.getElementById('search-terms');
    const addTermButton = document.getElementById('add-term');
    const termConnector = document.getElementById('term-connector');
    const generateUrlButton = document.getElementById('generate-url');
    const resultUrl = document.getElementById('result-url');
    const copyUrlButton = document.getElementById('copy-url');
    
    // Add event listeners
    addTermButton.addEventListener('click', addSearchTerm);
    generateUrlButton.addEventListener('click', generateUrl);
    copyUrlButton.addEventListener('click', copyToClipboard);
    
    // Initialize the first term's remove button
    initializeRemoveButtons();
    
    // Function to add a new search term input
    function addSearchTerm() {
        const newTerm = document.createElement('div');
        newTerm.className = 'search-term';
        
        // Add connector text if not the first term
        if (searchTermsContainer.children.length > 0) {
            const connector = document.createElement('div');
            connector.className = 'term-connector-text';
            connector.textContent = termConnector.value;
            searchTermsContainer.appendChild(connector);
        }
        
        newTerm.innerHTML = `
            <select class="field-selector">
                <option value="ti">Title</option>
                <option value="au">Author</option>
                <option value="abs">Abstract</option>
                <option value="co">Comment</option>
                <option value="jr">Journal Reference</option>
                <option value="cat">Category</option>
                <option value="all">All Fields</option>
            </select>
            <input type="text" class="term-input" placeholder="Enter search term">
            <button class="remove-term" title="Remove term">✕</button>
        `;
        
        searchTermsContainer.appendChild(newTerm);
        initializeRemoveButtons();
    }
    
    // Initialize remove buttons for search terms
    function initializeRemoveButtons() {
        document.querySelectorAll('.remove-term').forEach(button => {
            button.addEventListener('click', function() {
                // Find the term container
                const term = this.parentElement;
                
                // Find connector text before this term (if any)
                let connectorText = term.previousElementSibling;
                if (connectorText && connectorText.className === 'term-connector-text') {
                    connectorText.remove();
                }
                
                // Remove the term
                term.remove();
                
                // If no terms left, add one
                if (searchTermsContainer.children.length === 0) {
                    addSearchTerm();
                }
            });
        });
    }
    
    // Generate the URL based on the form inputs
    function generateUrl() {
        // Base URL for arXiv API
        const baseUrl = 'http://export.arxiv.org/api/query';
        
        // Get search terms
        const searchTerms = [];
        const terms = document.querySelectorAll('.search-term');
        let lastConnector = '';
        
        terms.forEach((term, index) => {
            const field = term.querySelector('.field-selector').value;
            const value = term.querySelector('.term-input').value.trim();
            
            if (value) {
                // Check if the value needs quotes (contains spaces)
                let formattedValue = value;
                if (value.includes(' ')) {
                    formattedValue = `"${value}"`;
                }
                
                // Create the search term string
                let searchTerm = `${field}:${formattedValue}`;
                
                // Add connector if not the first term
                if (index > 0) {
                    // Get the connector from the previous connector text
                    const connectorElements = document.querySelectorAll('.term-connector-text');
                    if (index - 1 < connectorElements.length) {
                        lastConnector = connectorElements[index - 1].textContent;
                    }
                    searchTerm = `${lastConnector} ${searchTerm}`;
                }
                
                searchTerms.push(searchTerm);
            }
        });
        
        // Get other options
        const sortBy = document.getElementById('sort-by').value;
        const sortOrder = document.getElementById('sort-order').value;
        const maxResults = document.getElementById('max-results').value;
        
        // Build the query parameters
        const params = new URLSearchParams();
        
        // Handle grouping for complex queries
        let searchQuery = '';
        if (searchTerms.length > 0) {
            // For complex queries with multiple terms, we add parentheses
            if (searchTerms.length > 1) {
                searchQuery = searchTerms.join(' ');
            } else {
                searchQuery = searchTerms[0];
            }
            params.append('search_query', searchQuery);
        }
        
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        params.append('start', '0');
        params.append('max_results', maxResults);
        
        // Generate the final URL
        const finalUrl = `${baseUrl}?${params.toString()}`;
        resultUrl.textContent = finalUrl;
        
        // Show the result container
        document.querySelector('.result-container').style.display = 'block';
    }
    
    // Copy URL to clipboard
    function copyToClipboard() {
        const text = resultUrl.textContent;
        
        if (!text) return;
        
        // Create a temporary textarea to copy from
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // Change button text temporarily
        const originalText = copyUrlButton.textContent;
        copyUrlButton.textContent = 'Copied!';
        setTimeout(() => {
            copyUrlButton.textContent = originalText;
        }, 2000);
    }
});
