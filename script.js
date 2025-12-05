document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const searchTermsContainer = document.getElementById('search-terms');
    const addTermButton = document.getElementById('add-term');
    const addGroupButton = document.getElementById('add-group');
    const termConnector = document.getElementById('term-connector');
    const generateUrlButton = document.getElementById('generate-url');
    const resultUrl = document.getElementById('result-url');
    const queryPreview = document.getElementById('query-preview');
    const copyUrlButton = document.getElementById('copy-url');
    
    // Add event listeners
    addTermButton.addEventListener('click', function() {
        // Find the active group or use the main search terms container
        const activeGroup = document.querySelector('.term-group.active') || searchTermsContainer;
        addSearchTerm(activeGroup);
    });
    
    addGroupButton.addEventListener('click', function() {
        // Find the active group or use the main search terms container
        const activeGroup = document.querySelector('.term-group.active') || searchTermsContainer;
        addTermGroup(activeGroup);
    });
    
    generateUrlButton.addEventListener('click', generateUrl);
    copyUrlButton.addEventListener('click', copyToClipboard);
    
    // Initialize the first term's remove button
    initializeRemoveButtons();
    
    // Make the root group selectable
    makeGroupSelectable(searchTermsContainer);
    
    // Function to add a new search term input to a group
    function addSearchTerm(group) {
        // Check if there are existing terms in this group
        const existingTerms = group.querySelectorAll('.search-term, .term-group');
        if (existingTerms.length > 0) {
            // Add connector label if not the first item
            const connector = document.createElement('div');
            connector.className = 'connector-label';
            connector.textContent = termConnector.value;
            group.appendChild(connector);
        }
        
        const newTerm = document.createElement('div');
        newTerm.className = 'search-term';
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
            <div class="term-actions">
                <button class="remove-term" title="Remove term">✕</button>
            </div>
        `;
        
        group.appendChild(newTerm);
        initializeRemoveButtons();
        updateGroupSelection(group);
    }
    
    // Function to add a new term group
    function addTermGroup(parentGroup) {
        // Check if there are existing items in the parent group
        const existingItems = parentGroup.querySelectorAll('.search-term, .term-group');
        if (existingItems.length > 0) {
            // Add connector label if not the first item
            const connector = document.createElement('div');
            connector.className = 'connector-label';
            connector.textContent = termConnector.value;
            parentGroup.appendChild(connector);
        }
        
        const newGroup = document.createElement('div');
        newGroup.className = 'term-group';
        newGroup.innerHTML = `
            <div class="group-controls">
                <span class="group-indicator">Group</span>
                <div class="group-actions">
                    <button class="remove-group" title="Remove group">✕</button>
                </div>
            </div>
        `;
        
        parentGroup.appendChild(newGroup);
        
        // Add the first term to the new group
        addSearchTerm(newGroup);
        
        // Initialize group controls
        initializeGroupControls();
        makeGroupSelectable(newGroup);
        updateGroupSelection(newGroup);
    }
    
    // Function to make a group selectable when clicked
    function makeGroupSelectable(group) {
        group.addEventListener('click', function(e) {
            // Prevent bubbling to parent groups
            if (e.target === group || group.contains(e.target)) {
                e.stopPropagation();
                
                // Only handle clicks on the group itself or group controls, not on child terms
                if (e.target === group || e.target.classList.contains('group-indicator')) {
                    updateGroupSelection(group);
                }
            }
        });
    }
    
    // Update the active group highlighting
    function updateGroupSelection(group) {
        // Remove active class from all groups
        document.querySelectorAll('.term-group').forEach(g => {
            g.classList.remove('active');
        });
        
        // Add active class to the clicked group
        group.classList.add('active');
    }
    
    // Initialize remove buttons for search terms
    function initializeRemoveButtons() {
        document.querySelectorAll('.remove-term').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent bubbling
                
                // Find the term container
                const term = this.closest('.search-term');
                
                // Find connector before this term (if any)
                let connector = term.previousElementSibling;
                if (connector && connector.className === 'connector-label') {
                    connector.remove();
                } else {
                    // If this is the first item, check if the next item has a connector
                    let nextElement = term.nextElementSibling;
                    if (nextElement && nextElement.className === 'connector-label') {
                        nextElement.remove();
                    }
                }
                
                // Remove the term
                term.remove();
                
                // Check if the parent group is empty
                const parentGroup = term.closest('.term-group');
                checkForEmptyGroup(parentGroup);
            });
        });
    }
    
    // Initialize group controls
    function initializeGroupControls() {
        document.querySelectorAll('.remove-group').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent bubbling
                
                // Find the group container
                const group = this.closest('.term-group');
                
                // Find connector before this group (if any)
                let connector = group.previousElementSibling;
                if (connector && connector.className === 'connector-label') {
                    connector.remove();
                } else {
                    // If this is the first item, check if the next item has a connector
                    let nextElement = group.nextElementSibling;
                    if (nextElement && nextElement.className === 'connector-label') {
                        nextElement.remove();
                    }
                }
                
                // Remove the group
                group.remove();
                
                // Check if the parent group is empty
                const parentGroup = group.parentElement.closest('.term-group');
                if (parentGroup) {
                    checkForEmptyGroup(parentGroup);
                }
            });
        });
    }
    
    // Check if a group is empty and add a default term if needed
    function checkForEmptyGroup(group) {
        if (!group) return;
        
        // Check if there are any terms or sub-groups
        const hasChildren = group.querySelector('.search-term, .term-group');
        
        if (!hasChildren) {
            // Root group should always have at least one term
            if (group === searchTermsContainer) {
                addSearchTerm(group);
            }
            // Non-root empty groups will be removed
            else if (group.parentElement) {
                // Find connector before this group (if any)
                let connector = group.previousElementSibling;
                if (connector && connector.className === 'connector-label') {
                    connector.remove();
                } else {
                    // If this is the first item, check if the next item has a connector
                    let nextElement = group.nextElementSibling;
                    if (nextElement && nextElement.className === 'connector-label') {
                        nextElement.remove();
                    }
                }
                group.remove();
            }
        }
    }
    
    // Function to recursively build query from groups and terms
    function buildQueryFromGroup(group) {
        let items = Array.from(group.children).filter(el =>
            el.classList.contains('search-term') ||
            el.classList.contains('term-group') ||
            el.classList.contains('connector-label')
        );

        if (items.length === 0) return '';

        let queryParts = [];
        let connector = 'AND'; // Default connector

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.classList.contains('connector-label')) {
                connector = item.textContent;
                continue;
            }

            let part = '';

            if (item.classList.contains('search-term')) {
                const field = item.querySelector('.field-selector').value;
                const value = item.querySelector('.term-input').value.trim();

                if (value) {
                    // Format the value (add quotes if it contains spaces)
                    let formattedValue = value.includes(' ') ? `"${value}"` : value;
                    // Always include the field prefix for each term
                    part = `${field}:${formattedValue}`;
                }
            }
            else if (item.classList.contains('term-group')) {
                // For nested groups, recursively build their query
                const innerQuery = buildQueryFromGroup(item);

                if (innerQuery) {
                    // Wrap nested group in parentheses for proper grouping
                    part = `(${innerQuery})`;
                }
            }

            if (part) {
                // If this isn't the first part and we have a connector from a previous item
                if (queryParts.length > 0) {
                    queryParts.push(connector);
                }
                queryParts.push(part);
            }
        }

        return queryParts.join(' ');
    }
    
    // Generate query preview 
    function updateQueryPreview() {
        const query = buildQueryFromGroup(searchTermsContainer);
        queryPreview.textContent = query || 'No query terms defined';
    }
    
    // Generate the URL based on the form inputs
    function generateUrl() {
        // Base URL for arXiv API
        const baseUrl = 'https://export.arxiv.org/api/query';
        
        // Build query from the entire structure
        const searchQuery = buildQueryFromGroup(searchTermsContainer);
        
        // Get other options
        const sortBy = document.getElementById('sort-by').value;
        const sortOrder = document.getElementById('sort-order').value;
        const maxResults = document.getElementById('max-results').value;
        
        // Build the query parameters
        const params = new URLSearchParams();
        
        if (searchQuery) {
            params.append('search_query', searchQuery);
        }
        
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        params.append('start', '0');
        params.append('max_results', maxResults);
        
        // Generate the final URL
        const finalUrl = `${baseUrl}?${params.toString()}`;
        resultUrl.textContent = finalUrl;
        
        // Update query preview
        updateQueryPreview();
        
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
    
    // Initialize group controls
    initializeGroupControls();
});
