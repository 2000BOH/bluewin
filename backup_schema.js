// backup_schema.js
const { Client } = require('pg');
const fs = require('fs');

async function backup() {
  const client = new Client({
    user: 'postgres.lcrrzsvppocnesuyqfna',
    host: '54.255.219.82', // aws-0-ap-southeast-1.pooler.supabase.com 의 IPv4 주소
    database: 'postgres',
    password: 'boh2398!!@@',
    port: 6543,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('✅ 싱가포르 DB에 연결되었습니다. 스키마 정보를 추출합니다...');

    let sql = '-- Bluewin Schema Backup (Manual Extraction)\n';
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    // 1. 커스텀 타입 (Enums) 추출
    console.log('- Enum 타입 추출 중...');
    const enums = await client.query(`
      SELECT t.typname as name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname;
    `);
    
    for (let row of enums.rows) {
      sql += `-- Enum: ${row.name}\n`;
      const values = Array.isArray(row.values) ? row.values : row.values.replace(/{|}/g, '').split(',');
      sql += `CREATE TYPE public.${row.name} AS ENUM ('${values.join("', '")}');\n\n`;
    }

    // 2. 테이블 생성 문장 (CREATE TABLE) 추출
    console.log('- 테이블 정보 추출 중...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    for (let row of tables.rows) {
      const tableName = row.table_name;
      console.log(`  > ${tableName} 테이블 구조 추출 중...`);
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default, udt_name
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);
      
      sql += `-- Table: ${tableName}\n`;
      sql += `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n`;
      const colDefs = columns.rows.map(col => {
        let type = col.data_type === 'USER-DEFINED' ? `public."${col.udt_name}"` : col.data_type;
        // timestamp with time zone 같은 긴 타입 이름 처리
        if (type.includes('timestamp')) type = 'timestamptz';
        
        let def = `  "${col.column_name}" ${type}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        if (col.column_default) {
            // default 값에 ::타입이 붙은 경우 처리
            let d = col.column_default;
            if (d.includes('::')) d = d.split('::')[0];
            def += ` DEFAULT ${d}`;
        }
        return def;
      });
      sql += colDefs.join(',\n');
      sql += `\n);\n\n`;
    }

    // 3. 함수(Functions) 추출
    console.log('- 함수(Functions) 소스코드 추출 중...');
    const functions = await client.query(`
      SELECT p.proname as name, pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public';
    `);

    for (let f of functions.rows) {
      sql += `-- Function: ${f.name}\n`;
      sql += `${f.definition};\n\n`;
    }

    // 4. 트리거(Triggers) 추출
    console.log('- 트리거(Triggers) 추출 중...');
    const triggers = await client.query(`
      SELECT tgname as name, pg_get_triggerdef(t.oid) as definition
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' AND t.tgisinternal = false;
    `);

    for (let t of triggers.rows) {
      sql += `-- Trigger: ${t.name}\n`;
      sql += `${t.definition};\n\n`;
    }

    // 5. RLS 정책(Policies) 추출
    console.log('- RLS 정책(Policies) 추출 중...');
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, 
             permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public';
    `);

    for (let p of policies.rows) {
      sql += `-- Policy: ${p.policyname} on ${p.tablename}\n`;
      const roles = Array.isArray(p.roles) ? p.roles : p.roles.replace(/{|}/g, '').split(',');
      sql += `CREATE POLICY "${p.policyname}" ON public."${p.tablename}"\n`;
      sql += `  FOR ${p.cmd} TO ${roles.join(', ')}\n`;
      if (p.qual) sql += `  USING (${p.qual})\n`;
      if (p.with_check) sql += `  WITH CHECK (${p.with_check})\n`;
      sql += `;\n\n`;
    }

    fs.writeFileSync('full_backup_manual.sql', sql);
    console.log('\n✅ 모든 정보가 추출되었습니다!');
    console.log('📁 생성된 파일: full_backup_manual.sql');
    
  } catch (err) {
    console.error('❌ 추출 중 오류 발생:', err.message);
  } finally {
    await client.end();
  }
}

backup();
