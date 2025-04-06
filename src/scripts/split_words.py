import json
import os

# Create output directory if it doesn't exist
output_dir = "src/resources/data/words"
os.makedirs(output_dir, exist_ok=True)

# Read the main words.json file
with open("src/resources/data/words.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Split each word into its own file
for word_data in data["words"]:
    word_id = word_data["id"]
    output_file = os.path.join(output_dir, f"word_{word_id}.json")
    
    # Create individual word JSON
    word_json = {
        "id": word_data["id"],
        "word": word_data["word"],
        "questions": word_data["questions"]
    }
    
    # Write to individual file
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(word_json, f, indent=2)

print("Words have been split into individual files in the 'words' directory.") 