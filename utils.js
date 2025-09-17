const fs = require('fs');
const path = require('path');

/**
 * Reads and parses a JSON file.
 * @param {string} filePath - The path to the file.
 * @param {any} [defaultValue=[]] - The default value to return if the file doesn't exist or is empty.
 * @returns {any} The parsed JSON object.
 */
function readJsonFile(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf-8');
    return content ? JSON.parse(content) : defaultValue;
  } catch (error) {
    console.error(`Failed to read JSON file: ${filePath}`, error);
    throw new Error(`Could not read file: ${path.basename(filePath)}`);
  }
}

/**
 * Writes data to a JSON file.
 * @param {string} filePath - The path to the file.
 * @param {any} data - The JavaScript object to write.
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to write JSON file: ${filePath}`, error);
    throw new Error(`Could not write to file: ${path.basename(filePath)}`);
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};