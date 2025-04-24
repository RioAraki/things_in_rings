import os
import json
import glob
import plotly.graph_objects as go
import pandas as pd

def generate_word_rules_table():
    # Load all rule questions first
    rule_questions = load_rule_questions()
    
    # Create a DataFrame to store the data
    all_words = []
    all_word_ids = []
    all_rule_results = []
    
    # Process each word file
    files = glob.glob("src/resources/data/words_zh/word_*.json")
    for file_path in sorted(files):
        try:
            with open(file_path, 'r', encoding='utf-8') as json_file:
                content = json.load(json_file)
            
            # Skip files that don't have questions array
            if 'questions' not in content or not content['questions']:
                print(f"Skipping {file_path}: No questions array found")
                continue
            
            word = content['word']
            word_id = content.get('id', extract_id_from_filename(file_path))
            
            all_words.append(word)
            all_word_ids.append(word_id)
            
            # Create a dictionary for rule results
            rule_results = {}
            for i in range(1, 151):
                rule_results[i] = '-'  # Default value
                
            for question in content['questions']:
                rule_id = int(question['ruleId'])
                # Convert to boolean to ensure consistent type
                result = bool(question['result'])
                rule_results[rule_id] = result
            
            all_rule_results.append(rule_results)
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    # Create a DataFrame
    df = pd.DataFrame(all_rule_results, index=all_words)
    
    # Create only the full table with all rules
    create_full_table(all_words, all_word_ids, all_rule_results, rule_questions, "word_rules_table.html")
    
    print("Table visualization generated successfully. Check word_rules_table.html for the full table.")

def extract_id_from_filename(file_path):
    """Extract ID from filename like word_1.json -> 1"""
    try:
        basename = os.path.basename(file_path)
        # Extract number from pattern "word_X.json"
        if basename.startswith("word_") and basename.endswith(".json"):
            num_part = basename[5:-5]  # Remove "word_" and ".json"
            return num_part
    except:
        pass
    return "?"

def load_rule_questions():
    """Load all rules questions from the rules files"""
    rule_questions = {}
    
    # Load context rules (1-50)
    try:
        with open("src/resources/data/rules_zh/context_rules.json", 'r', encoding='utf-8') as file:
            context_rules = json.load(file)
            for rule in context_rules["rules"]:
                rule_questions[rule["id"]] = rule["question"]
    except Exception as e:
        print(f"Error loading context rules: {e}")
    
    # Load property rules (51-100)
    try:
        with open("src/resources/data/rules_zh/property_rules.json", 'r', encoding='utf-8') as file:
            property_rules = json.load(file)
            for rule in property_rules["rules"]:
                rule_questions[rule["id"]] = rule["question"]
    except Exception as e:
        print(f"Error loading property rules: {e}")
    
    # Load wording rules (101-150)
    try:
        with open("src/resources/data/rules_zh/wording_rules.json", 'r', encoding='utf-8') as file:
            wording_rules = json.load(file)
            for rule in wording_rules["rules"]:
                rule_questions[rule["id"]] = rule["question"]
    except Exception as e:
        print(f"Error loading wording rules: {e}")
    
    return rule_questions

def create_full_table(all_words, all_word_ids, all_rule_results, rule_questions, output_file):
    """Create a full table with all rules and fixed first column"""
    # Create HTML directly for better control over fixed column
    
    # Prepare HTML header
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>词语规则可视化表格</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background-color: #f5f5f5;
                margin: 0;
            }
            .container {
                max-width: 100%;
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                position: relative;
            }
            h1 {
                text-align: center;
                margin-bottom: 20px;
                color: #333;
            }
            .table-container {
                position: relative;
                max-width: 100%;
                overflow: auto;
                max-height: 80vh;  /* Limit height to enable vertical scrolling */
                border: 1px solid #ddd;
            }
            table {
                border-collapse: collapse;
                width: auto;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: center;
                min-width: 100px;
            }
            th {
                background-color: paleturquoise;
                position: sticky;
                top: 0;
                z-index: 10;
                font-weight: bold;
            }
            /* Second header row - questions */
            tr:nth-child(1) th {
                top: 0;
                height: 30px;
            }
            tr:nth-child(2) th {
                top: 47px; /* Height of first header row + border */
                height: 80px;
            }
            tr:nth-child(even):not(:nth-child(2)) {
                background-color: #f9f9f9;
            }
            tr:hover:not(:nth-child(1)):not(:nth-child(2)) {
                background-color: #f0f0f0;
            }
            /* First column - ID */
            .id-cell {
                position: sticky;
                left: 0;
                background-color: #f0f0f0;
                z-index: 5;
                font-weight: bold;
                min-width: 60px;
                max-width: 60px;
            }
            /* Second column - Word */
            .word-cell {
                position: sticky;
                left: 60px; /* Width of the ID column */
                background-color: #f0f0f0;
                z-index: 5;
                font-weight: bold;
                min-width: 80px;
            }
            /* Special background for sticky cells when row is hovered */
            tr:hover:not(:nth-child(1)):not(:nth-child(2)) .id-cell,
            tr:hover:not(:nth-child(1)):not(:nth-child(2)) .word-cell {
                background-color: #e0e0e0;
            }
            /* Special background for sticky cells in even rows */
            tr:nth-child(even):not(:nth-child(2)) .id-cell,
            tr:nth-child(even):not(:nth-child(2)) .word-cell {
                background-color: #e6e6e6;
            }
            /* Fixed headers for ID and Word columns */
            .id-header {
                position: sticky;
                left: 0;
                z-index: 15;
                background-color: #2c3e50;
                color: white;
                min-width: 60px;
                max-width: 60px;
            }
            .word-header {
                position: sticky;
                left: 60px; /* Width of the ID column */
                z-index: 15;
                background-color: #2c3e50;
                color: white;
            }
            .rule-id-row th:not(.id-header):not(.word-header) {
                background-color: #4a6da7;
                color: white;
                height: 30px;
                font-weight: bold;
            }
            .true {
                background-color: lightgreen;
            }
            .false {
                background-color: lightcoral;
            }
            /* Ensure correct background when cell has a result and is in the sticky column */
            tr:nth-child(even):not(:nth-child(2)) .id-cell.true,
            tr:nth-child(even):not(:nth-child(2)) .word-cell.true {
                background-color: lightgreen;
            }
            tr:nth-child(even):not(:nth-child(2)) .id-cell.false,
            tr:nth-child(even):not(:nth-child(2)) .word-cell.false {
                background-color: lightcoral;
            }
            .rule-title {
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            /* Show full text on hover */
            .rule-title:hover {
                overflow: visible;
                white-space: normal;
                background-color: #eafaea;
                position: absolute;
                z-index: 20;
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                border-radius: 3px;
                padding: 5px;
            }
            /* Controls for the table */
            .controls {
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
            }
            .legend {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            .legend-item {
                display: flex;
                align-items: center;
                margin-right: 15px;
            }
            .legend-color {
                width: 20px;
                height: 20px;
                display: inline-block;
                margin-right: 5px;
                border: 1px solid #ccc;
            }
            .filter-controls {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-bottom: 10px;
            }
            /* Category filters */
            .category-filters {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-bottom: 10px;
            }
            /* Button styling */
            button {
                padding: 5px 10px;
                background-color: #4a6da7;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                margin-bottom: 5px;
            }
            button:hover {
                background-color: #345286;
            }
            button.active {
                background-color: #2c3e50;
            }
            /* Hide rows based on filter */
            .hide-true .row-has-true:not(.row-has-false) {
                display: none;
            }
            .hide-false .row-has-false:not(.row-has-true) {
                display: none;
            }
            .highlight-diff tr:not(.has-diff):not(:nth-child(1)):not(:nth-child(2)) {
                opacity: 0.5;
            }
            /* Category filters */
            .hide-context td[data-category="context"],
            .hide-context th[data-category="context"] {
                display: none;
            }
            .hide-property td[data-category="property"],
            .hide-property th[data-category="property"] {
                display: none;
            }
            .hide-wording td[data-category="wording"],
            .hide-wording th[data-category="wording"] {
                display: none;
            }
            /* Footer */
            .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 0.9em;
                color: #666;
            }
            /* Stats */
            .stats {
                margin-top: 5px;
                color: #666;
                font-size: 0.9em;
            }
            .stat-item {
                margin-right: 15px;
                display: inline-block;
            }
            /* Search box */
            .search-box {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
                align-items: center;
            }
            #searchInput {
                padding: 5px;
                width: 200px;
                border: 1px solid #ddd;
                border-radius: 3px;
            }
        </style>
        <script>
            // JavaScript for filtering and interactions
            document.addEventListener('DOMContentLoaded', function() {
                const tableContainer = document.getElementById('tableContainer');
                
                // Filter true/false values
                document.getElementById('filterTrue').addEventListener('click', function() {
                    tableContainer.classList.toggle('hide-true');
                    this.classList.toggle('active');
                });
                
                document.getElementById('filterFalse').addEventListener('click', function() {
                    tableContainer.classList.toggle('hide-false');
                    this.classList.toggle('active');
                });
                
                // Highlight rows with differing results
                document.getElementById('highlightDiff').addEventListener('click', function() {
                    tableContainer.classList.toggle('highlight-diff');
                    this.classList.toggle('active');
                });
                
                // Filter by category
                document.getElementById('hideContext').addEventListener('click', function() {
                    tableContainer.classList.toggle('hide-context');
                    this.classList.toggle('active');
                });
                
                document.getElementById('hideProperty').addEventListener('click', function() {
                    tableContainer.classList.toggle('hide-property');
                    this.classList.toggle('active');
                });
                
                document.getElementById('hideWording').addEventListener('click', function() {
                    tableContainer.classList.toggle('hide-wording');
                    this.classList.toggle('active');
                });
                
                // Toggle all filters off
                document.getElementById('resetFilters').addEventListener('click', function() {
                    tableContainer.classList.remove(
                        'hide-true', 
                        'hide-false', 
                        'highlight-diff',
                        'hide-context',
                        'hide-property',
                        'hide-wording'
                    );
                    document.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                });
                
                // Search functionality
                document.getElementById('searchInput').addEventListener('input', function() {
                    const searchTerm = this.value.toLowerCase();
                    const rows = document.querySelectorAll('tbody tr');
                    let visibleRows = 0;
                    
                    rows.forEach(row => {
                        const wordCell = row.querySelector('.word-cell');
                        const idCell = row.querySelector('.id-cell');
                        if (wordCell && idCell) {
                            const word = wordCell.textContent.toLowerCase();
                            const id = idCell.textContent.toLowerCase();
                            if (word.includes(searchTerm) || id.includes(searchTerm)) {
                                row.style.display = '';
                                visibleRows++;
                            } else {
                                row.style.display = 'none';
                            }
                        }
                    });
                    
                    // Update visible rows count
                    document.getElementById('visibleRowsCount').textContent = visibleRows;
                });
                
                // Count initial stats
                const countStats = () => {
                    const rows = document.querySelectorAll('tbody tr');
                    const totalRows = rows.length;
                    document.getElementById('totalRowsCount').textContent = totalRows;
                    document.getElementById('visibleRowsCount').textContent = totalRows;
                };
                
                // Run initial stats
                countStats();
                
                // Export to CSV
                document.getElementById('exportCSV').addEventListener('click', function() {
                    const table = document.querySelector('table');
                    const rows = Array.from(table.querySelectorAll('tr'));
                    
                    let csvContent = "data:text/csv;charset=utf-8,";
                    
                    rows.forEach(row => {
                        const cells = Array.from(row.querySelectorAll('th, td'));
                        const rowData = cells.map(cell => {
                            // Get text content and remove possible HTML
                            let content = cell.textContent.trim();
                            // Escape quotes and wrap in quotes if contains comma
                            content = content.replace(/"/g, '""');
                            if (content.includes(',')) {
                                content = `"${content}"`;
                            }
                            return content;
                        });
                        csvContent += rowData.join(',') + "\\r\\n";
                    });
                    
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "word_rules_table.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            });
        </script>
    </head>
    <body>
        <div class="container">
            <h1>词语规则可视化表格</h1>
            
            <div class="controls">
                <div class="legend">
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: lightgreen;"></span>
                        <span>True (是)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: lightcoral;"></span>
                        <span>False (否)</span>
                    </div>
                </div>
                
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="搜索ID或词语...">
                    <button id="exportCSV">导出为CSV</button>
                    <div class="stats">
                        <span class="stat-item">显示: <span id="visibleRowsCount">0</span>/<span id="totalRowsCount">0</span> 词</span>
                    </div>
                </div>
                
                <div class="filter-controls">
                    <button id="filterTrue">隐藏纯True行</button>
                    <button id="filterFalse">隐藏纯False行</button>
                    <button id="highlightDiff">突出显示差异行</button>
                </div>
                
                <div class="category-filters">
                    <button id="hideContext">切换语境规则 (1-50)</button>
                    <button id="hideProperty">切换属性规则 (51-100)</button>
                    <button id="hideWording">切换文字规则 (101-150)</button>
                    <button id="resetFilters">重置所有筛选</button>
                </div>
            </div>
            
            <div id="tableContainer" class="table-container">
                <table>
                    <thead>
                        <tr class="rule-id-row">
                            <th class="id-header">ID</th>
                            <th class="word-header">规则编号</th>
    """
    
    # Add rule ID numbers in first header row
    for i in range(1, 151):
        category = ""
        if 1 <= i <= 50:
            category = "context"
        elif 51 <= i <= 100:
            category = "property"
        elif 101 <= i <= 150:
            category = "wording"
            
        html += f'<th data-category="{category}">{i}</th>\n'
    
    html += """
                        </tr>
                        <tr>
                            <th class="id-header">ID</th>
                            <th class="word-header">词语</th>
    """
    
    # Add rule headers with category data attributes in second header row
    for i in range(1, 151):
        question = rule_questions.get(i, "未知问题")
        category = ""
        if 1 <= i <= 50:
            category = "context"
        elif 51 <= i <= 100:
            category = "property"
        elif 101 <= i <= 150:
            category = "wording"
            
        html += f'<th data-category="{category}"><div class="rule-title">{question}</div></th>\n'
    
    html += """
                        </tr>
                    </thead>
                    <tbody>
    """
    
    # Add rows for each word
    for word_idx, word in enumerate(all_words):
        word_id = all_word_ids[word_idx]
        
        # Determine if row has true/false values
        has_true = False
        has_false = False
        has_diff = False
        prev_val = None
        
        for rule_id in range(1, 151):
            value = all_rule_results[word_idx].get(rule_id, '-')
            if value is True:
                has_true = True
                if prev_val is False:
                    has_diff = True
                prev_val = True
            elif value is False:
                has_false = True
                if prev_val is True:
                    has_diff = True
                prev_val = False
        
        row_classes = []
        if has_true:
            row_classes.append("row-has-true")
        if has_false:
            row_classes.append("row-has-false")
        if has_diff:
            row_classes.append("has-diff")
        
        html += f'<tr class="{" ".join(row_classes)}">\n'
        html += f'<td class="id-cell">{word_id}</td>\n'
        html += f'<td class="word-cell">{word}</td>\n'
        
        # Add cells for each rule
        for rule_id in range(1, 151):
            value = all_rule_results[word_idx].get(rule_id, '-')
            
            # Determine category
            category = ""
            if 1 <= rule_id <= 50:
                category = "context"
            elif 51 <= rule_id <= 100:
                category = "property"
            elif 101 <= rule_id <= 150:
                category = "wording"
            
            # Determine cell class and text
            if value is True:
                cell_class = "true"
                cell_text = "true"
            elif value is False:
                cell_class = "false"
                cell_text = "false"
            else:
                cell_class = ""
                cell_text = "-"
                
            html += f'<td class="{cell_class}" data-category="{category}">{cell_text}</td>\n'
        
        html += '</tr>\n'
    
    # Complete HTML
    html += """
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <p>生成日期: """ + pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S') + """</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Write the HTML file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Interactive table generated at {output_file}")

if __name__ == "__main__":
    generate_word_rules_table()
if __name__ == "__main__":
    generate_word_rules_table()