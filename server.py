#!/usr/bin/env python3
"""
Simple server to handle saving word JSON files
"""

import json
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
WORDS_DIR = "src/resources/data/words_zh"
PORT = 5000

@app.route('/')
def index():
    return send_from_directory('.', 'word_rules_table_interactive.html')

@app.route('/word_rules_table.html')
def original_table():
    return send_from_directory('.', 'word_rules_table.html')

@app.route('/src/resources/data/words_zh/<filename>')
def serve_word_file(filename):
    return send_from_directory(WORDS_DIR, filename)

@app.route('/api/save-word/<int:word_id>', methods=['POST'])
def save_word(word_id):
    try:
        # Get the JSON data from the request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate the data structure
        if 'id' not in data or 'word' not in data or 'questions' not in data:
            return jsonify({'error': 'Invalid data structure'}), 400
        
        # Ensure the word ID matches
        if data['id'] != word_id:
            return jsonify({'error': 'Word ID mismatch'}), 400
        
        # Create the filename
        filename = f"word_{word_id}.json"
        filepath = os.path.join(WORDS_DIR, filename)
        
        # Write the JSON file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'message': f'Successfully saved {filename}'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/words')
def list_words():
    """List all available word files"""
    try:
        files = []
        for filename in os.listdir(WORDS_DIR):
            if filename.startswith('word_') and filename.endswith('.json'):
                files.append(filename)
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print(f"Starting server on port {PORT}")
    print(f"Words directory: {WORDS_DIR}")
    print(f"Open http://localhost:{PORT} in your browser")
    app.run(host='0.0.0.0', port=PORT, debug=True) 