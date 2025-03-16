# arXiv RSS Feed Generator

A simple, elegant web tool that allows you to create custom RSS feeds for arXiv search queries. Stay up-to-date with the latest research papers in your field by subscribing to precisely crafted searches.

## Try it now

**Live Demo**: [arXiv RSS Feed Generator](https://ronpay.github.io/arxiv-rss-feed-generator/)

No installation needed - just use the online tool to create your custom arXiv RSS feeds instantly.

## Features

- Create complex search queries with an intuitive interface
- Support for nested groups with different boolean operators (AND, OR, ANDNOT)
- Search in specific fields (title, author, abstract, etc.)
- Sort results by relevance, submission date, or update date
- Generate an RSS feed URL you can use in any feed reader

## How to Use

### Creating Your Search Query

1. **Define your search terms**:
   - Select the field you want to search (Title, Author, Abstract, etc.)
   - Enter your search term
   - For terms with spaces, they will be automatically quoted in the query

2. **Add multiple terms**:
   - Click "Add Term" to add another search term
   - Select the connector (AND, OR, ANDNOT) from the dropdown to define how terms relate

3. **Create groups for complex queries**:
   - Click "Add Group" to create a nested group of terms
   - Groups will be enclosed in parentheses in the final query
   - Click on a group header to select it before adding terms/groups inside it
   - You can nest groups within groups for complex boolean logic

4. **Set search options**:
   - Sort by: Choose between relevance, last updated date, or submission date
   - Sort order: Ascending or descending
   - Max results: Number of results to include in the feed (1-2000)

5. **Generate your RSS URL**:
   - Click "Generate RSS URL" to create your feed URL
   - Use the "Copy" button to copy the URL to your clipboard

### Using Your RSS Feed

#### With NetNewsWire (iOS/macOS)

1. Copy your generated RSS URL
2. Open NetNewsWire
3. Click the "+" button to add a feed
4. Select "New Feed..."
5. Paste your URL and click "Add"

You'll now receive updates whenever new papers matching your search criteria are published on arXiv.

#### With Other RSS Readers

Most RSS readers follow a similar process:
1. Look for an "Add subscription" or "Add feed" option
2. Paste your generated URL
3. Save or confirm

## Example Queries

### Simple Queries

1. **Papers about large language model**
   - Field: "Title", Term: "large language model"
   - Connector: "OR" 
   - Field: "Title", Term: "llm"

2. **Papers by specific authors**
   - Field: "Author", Term: "bengio"
   - Connector: "AND"
   - Field: "Author", Term: "hinton"

### Complex Queries with Nesting

1. **Papers about quantum algorithms**
   - Add a group
   - Inside group: Field: "Title", Term: "quantum"
   - Connector: "OR"
   - Field: "Title", Term: "qubits"
   - Outside group: Connector: "AND"
   - Field: "Title", Term: "algorithm"

## Understanding Query Structure

The arXiv API uses a specific format for search queries:

- `ti:term` searches for "term" in titles
- `au:term` searches for "term" in author names
- `abs:term` searches for "term" in abstracts
- `cat:term` searches for "term" in categories
- Multiple terms can be combined with `AND`, `OR`, or `ANDNOT`
- Parentheses `()` can group terms together
- Phrases with spaces need quotes: `ti:"machine learning"`

The Query Structure Preview shows you exactly how your query will be formatted.

## Technical Details

This tool uses the arXiv API to generate search queries. The API returns results in Atom format, which is compatible with all modern RSS readers.

Important notes:
- arXiv updates its database once per day (usually around midnight EST)
- Some complex queries may not work as expected if they exceed arXiv's query limitations
- Be specific in your searches to avoid too many results

## Troubleshooting

**My feed isn't updating**
- arXiv only updates once per day, so new papers will only appear after the daily update
- Check if your query returns any results by opening the URL in a browser

**I'm getting too many results**
- Make your search more specific by adding more terms or restricting to specific categories

**My query doesn't work**
- Make sure your search terms are spelled correctly
- Simplify your query to identify which part might be causing the issue
- Check the query structure preview to ensure your boolean logic is correct

**My RSS reader says the feed is invalid**
- Try testing the generated URL directly in your browser to ensure it returns valid XML
- Some readers have limitations with complex URLs - try URL encoding if available

## About the Tool

This tool is a simple client-side application built with HTML, CSS, and JavaScript. It doesn't store any data and all processing happens in your browser. Your queries are sent directly to the arXiv API.

## License

This project is open source and available under the GPL-3.0 License.

## Credits

This tool uses the [arXiv API](https://info.arxiv.org/help/api/user-manual.html).

