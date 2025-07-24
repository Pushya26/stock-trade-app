// Script to check major companies count
const fs = require('fs');

// Read the lseCompaniesParser file manually
const companiesParserPath = './src/news/lseCompaniesParser.js';
const companiesParserContent = fs.readFileSync(companiesParserPath, 'utf8');

// Count major companies from the file content
const majorCompaniesMatches = companiesParserContent.match(/isMajor: true/g);
const totalMajorCompanies = majorCompaniesMatches ? majorCompaniesMatches.length : 0;

console.log('=== LSE COMPANIES ANALYSIS ===');
console.log('');
console.log('1. HARDCODED COMPANIES (lseCompaniesParser.js):');
console.log(`   - Major companies (isMajor: true): ${totalMajorCompanies}`);
console.log(`   - These are manually curated top LSE companies`);
console.log('');

// Read CSV file
const csvPath = './stocks/stocks_symbols.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n');
const csvCompanies = lines.length - 2; // Subtract header and empty line

console.log('2. CSV COMPANIES (stocks_symbols.csv):');
console.log(`   - Total companies in CSV: ${csvCompanies}`);
console.log(`   - These are ALL LSE listed companies`);
console.log(`   - Note: CSV only has symbol/name, no market cap data`);
console.log('');

console.log('3. SYSTEM BEHAVIOR:');
console.log('   - The system uses BOTH sources:');
console.log(`     * ${totalMajorCompanies} hardcoded major companies (curated)`);
console.log(`     * ${csvCompanies} CSV companies (comprehensive list)`);
console.log('   - "Major companies" refers to the hardcoded list only');
console.log('   - CSV companies are processed but not classified as "major"');
console.log('');

console.log('4. RECENT CHANGES:');
console.log('   - ALL CSV companies now processed (increased from 500 limit)');
console.log('   - System can search across all 5,946+ companies');
console.log('   - Enhanced coverage for comprehensive news matching');
