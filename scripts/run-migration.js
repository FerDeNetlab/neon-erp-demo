const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const schema = fs.readFileSync('scripts/000-frabe-schema.sql', 'utf-8');
  
  // Split intelligently: handle DO $$ blocks
  const blocks = [];
  let current = '';
  let dollarCount = 0;
  
  for (const line of schema.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') && dollarCount % 2 === 0) {
      continue; // skip pure comments outside of $$ blocks
    }
    
    // Count $$ occurrences  
    const matches = line.match(/\$\$/g);
    if (matches) dollarCount += matches.length;
    
    current += line + '\n';
    
    if (trimmed.endsWith(';') && dollarCount % 2 === 0) {
      const clean = current.replace(/--[^\n]*/g, '').trim();
      if (clean.length > 1) {
        blocks.push(current.trim());
      }
      current = '';
    }
  }
  if (current.trim()) blocks.push(current.trim());

  console.log('Statements to execute:', blocks.length);
  let ok = 0, errors = 0;
  
  for (let i = 0; i < blocks.length; i++) {
    const stmt = blocks[i];
    try {
      // Use sql.query() for dynamic SQL strings
      await sql.query(stmt);
      ok++;
      const preview = stmt.split('\n').find(l => l.trim() && !l.trim().startsWith('--')) || '';
      if (preview.includes('DROP') || preview.includes('CREATE TABLE') || preview.includes('CREATE INDEX') || preview.includes('ALTER')) {
        console.log(`  ✓ [${i+1}] ${preview.substring(0, 75)}`);
      }
    } catch (e) {
      errors++;
      const preview = stmt.split('\n').find(l => l.trim() && !l.trim().startsWith('--')) || stmt.substring(0, 60);
      console.error(`  ✗ [${i+1}] ${preview.substring(0, 75)}`);
      console.error(`    Error: ${e.message.substring(0, 120)}`);
    }
  }
  
  console.log(`\nResult: OK: ${ok}, Errors: ${errors}`);
  
  // Verify
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log(`\nTables (${tables.length}):`, tables.map(t => t.table_name).join(', '));
})().catch(console.error);
