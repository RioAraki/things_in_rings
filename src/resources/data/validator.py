import json
import os
import requests
import argparse
import re
import glob

# Set the API key as environment variable
def load_rules_from_file(file_path):
    """Load rules from a JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('rules', [])

def get_all_rules():
    """Get all rules from the rules_zh directory."""
    rules_dir = os.path.join(os.path.dirname(__file__), 'rules_zh')
    
    all_rules = []
    rule_files = [
        os.path.join(rules_dir, 'context_rules.json'),
        os.path.join(rules_dir, 'wording_rules.json'),
        os.path.join(rules_dir, 'property_rules.json')
    ]
    
    for file_path in rule_files:
        rules = load_rules_from_file(file_path)
        all_rules.extend(rules)
    
    return all_rules

def validate_word(word, api_key=None):
    """Validate a word against all rules using OpenAI API."""
    if not api_key:
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OpenAI API key not provided")
    
    all_rules = get_all_rules()
    
    system_prompt = f"""
下面是一组要验证的规则列表（JSON 数组），
当我给定一个"词语"时，请拆解它的笔画，部首和声调，请你针对共150条规则输出 true/false 并给出简要理由：
{json.dumps(all_rules, ensure_ascii=False, indent=None)}

请使用以下格式回答，确保每条规则的ruleId, result 和 reason都在同一行：
ruleId: 1, result: true/false, reason: 简短理由
ruleId: 2, result: true/false, reason: 简短理由
...

请确保对所有规则都给出回答，不要遗漏任何规则。
请确保reason字段不包含换行符，所有内容都在一行内完成。
    """
    
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": "gpt-4.1",  # Updated to use gpt-4.1
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": word}
        ]
    }
    
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    result = response.json()
    
    return result['choices'][0]['message']['content']

def find_existing_word_file(word, output_dir):
    """Find if the word already exists in any word_x.json file."""
    for file_path in glob.glob(os.path.join(output_dir, "word_*.json")):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data.get("word") == word:
                    return file_path, data.get("id")
        except Exception as e:
            print(f"Error reading {file_path}: {str(e)}")
    return None, None

def find_next_file_number(output_dir):
    """Find the next available number for word_x.json"""
    i = 1
    while os.path.exists(os.path.join(output_dir, f"word_{i}.json")):
        i += 1
    return i

def clean_reason_text(text):
    """Clean reason text to ensure it's on a single line."""
    # Replace newlines, tabs with spaces
    text = re.sub(r'[\n\r\t]+', ' ', text)
    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    # Trim whitespace
    return text.strip()

def parse_validation_result(text, all_rules=None):
    """Parse the validation result text into a structured format."""
    if all_rules is None:
        all_rules = get_all_rules()
    
    # Create a dictionary of all rules with default values
    rule_questions = {}
    for rule in all_rules:
        rule_id = rule.get('id')
        if rule_id:
            rule_questions[rule_id] = {
                "ruleId": rule_id,
                "result": False,
                "reason": f"未获得对规则 {rule_id} 的回答"
            }
    
    # Look for lines with ruleId, result, and reason
    pattern = r'ruleId:\s*(\d+),\s*result:\s*(true|false),\s*reason:\s*(.+)'
    
    for line in text.split('\n'):
        match = re.search(pattern, line, re.IGNORECASE)
        if match:
            rule_id, result, reason = match.groups()
            try:
                rule_id = int(rule_id)
                # Clean reason text to ensure it's on a single line
                clean_reason = clean_reason_text(reason)
                rule_questions[rule_id] = {
                    "ruleId": rule_id,
                    "result": result.lower() == "true",
                    "reason": clean_reason
                }
            except (ValueError, KeyError):
                # Skip if rule_id is not a valid integer or not in our rules
                continue
    
    # Convert dictionary to list ordered by rule ID
    questions = []
    for rule_id in sorted(rule_questions.keys()):
        questions.append(rule_questions[rule_id])
    
    return questions

def save_result(word, result, output_dir, file_id=None):
    """Save the validation result to a JSON file."""
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all rules for complete validation
    all_rules = get_all_rules()
    
    # Parse the validation result
    questions = parse_validation_result(result, all_rules)
    
    # Determine file number/id
    if file_id is not None:
        file_number = file_id
    else:
        file_number = find_next_file_number(output_dir)
        
    output_file = os.path.join(output_dir, f"word_{file_number}.json")
    
    # Create output structure matching the existing format
    output_data = {
        "id": str(file_number),
        "word": word,
        "questions": questions
    }
    
    # Custom JSON formatting to ensure each rule is on one line
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("{\n")
        f.write(f'  "id": "{file_number}",\n')
        f.write(f'  "word": "{word}",\n')
        f.write('  "questions": [\n')
        
        for i, q in enumerate(questions):
            rule_id = q["ruleId"]
            result_str = "true" if q["result"] else "false"
            reason = q["reason"].replace('"', "'")  # Use single quotes in reason
            
            line = f'    {{"ruleId": {rule_id}, "result": {result_str}, "reason": "{reason}"}}'
            if i < len(questions) - 1:
                line += ","
            f.write(line + "\n")
            
        f.write("  ]\n")
        f.write("}\n")
    
    # Print statistics
    answered = sum(1 for q in questions if q["reason"] != f"未获得对规则 {q['ruleId']} 的回答")
    print(f"Validation complete: {answered}/{len(questions)} rules answered")
    
    return output_file

def main():
    """Main function to run the validator."""
    parser = argparse.ArgumentParser(description='Validate a Chinese word against rules.')
    # Make word argument optional when word-id is provided
    parser.add_argument('word', nargs='?', help='The word to validate')
    parser.add_argument('--api-key', help='OpenAI API key (or set OPENAI_API_KEY env var)')
    parser.add_argument('--output-dir', default='words_zh', help='Directory to save results')
    parser.add_argument('--force', action='store_true', help='Force overwrite if word already exists')
    parser.add_argument('--word-id', type=int, help='Validate a specific word_x.json file')
    
    args = parser.parse_args()
    
    try:
        # Set up output directory
        output_dir = os.path.join(os.path.dirname(__file__), args.output_dir)
        os.makedirs(output_dir, exist_ok=True)
        
        # If word-id is provided, we use that specific file
        if args.word_id is not None:
            word_file = os.path.join(output_dir, f"word_{args.word_id}.json")
            if os.path.exists(word_file):
                with open(word_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    word = data.get("word")
                    if not word:
                        raise ValueError(f"No word found in {word_file}")
                    
                print(f"Validating existing word '{word}' from {word_file}")
                result = validate_word(word, args.api_key)
                output_file = save_result(word, result, output_dir, args.word_id)
                print(f"Validation result saved to: {output_file}")
                return
            else:
                raise ValueError(f"File {word_file} does not exist")
        
        # If no word-id is provided, we need a word argument
        if args.word is None:
            parser.error("the following arguments are required: word (unless --word-id is specified)")
        
        # Check if word already exists
        existing_file, existing_id = find_existing_word_file(args.word, output_dir)
        
        if existing_file and not args.force:
            print(f"Word '{args.word}' already exists in {existing_file}")
            print("Use --force to overwrite")
            return
            
        # Validate the word
        result = validate_word(args.word, args.api_key)
        
        # Save the result
        if existing_file:
            output_file = save_result(args.word, result, output_dir, existing_id)
            print(f"Updated existing word in: {output_file}")
        else:
            output_file = save_result(args.word, result, output_dir)
            print(f"Validation result saved to: {output_file}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()