const fs = require('fs');
const path = require('path');

// Read the words.json file from the correct location
const wordsPath = path.join(__dirname, '../resources/data/words.json');
const wordsData = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

// Extract the words array from the data and normalize the data
const words = wordsData.words.map(word => ({
  ...word,
  questions: word.questions.map(q => ({
    ...q,
    // Convert result to boolean if it's a string
    result: typeof q.result === 'string' ? q.result.toLowerCase() === 'true' : q.result
  }))
}));

// Create the output directory if it doesn't exist
const outputDir = path.join(__dirname, '../data/words');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create an index file to export all words
const indexContent = [];

// Split each word into a separate file
words.forEach((word, index) => {
  // Create a filename based on the word's id
  const filename = `${word.id}.json`;
  const filePath = path.join(outputDir, filename);
  
  // Write the word to its own file
  fs.writeFileSync(filePath, JSON.stringify(word, null, 2));
  
  // Add an import statement to the index file
  indexContent.push(`import word${index} from './${filename}';`);
});

// Add export statement to the index file
indexContent.push('');
indexContent.push('const words = [');
words.forEach((_, index) => {
  indexContent.push(`  word${index},`);
});
indexContent.push('];');
indexContent.push('');
indexContent.push('export default words;');

// Write the index file
const indexFilePath = path.join(outputDir, 'index.ts');
fs.writeFileSync(indexFilePath, indexContent.join('\n'));

console.log(`Successfully split ${words.length} words into separate files.`);
console.log(`Index file created at: ${indexFilePath}`); 