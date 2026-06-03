/**
 * 移除 docs-website 中所有文档的文头注释
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs-website');

function removeHeaderFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 检查是否有 /** ... */ 形式的文头
    const headerPattern = /^\/\*\*(?:\s|\S)*?\*\//;
    const hasHeader = headerPattern.test(content);
    
    if (!hasHeader) {
      console.log(`跳过（无文头）: ${path.relative(process.cwd(), filePath)}`);
      return false;
    }
    
    // 移除文头，并清理文头后的多余空行
    const newContent = content.replace(headerPattern, '').replace(/^\s*/, '');
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ 已处理: ${path.relative(process.cwd(), filePath)}`);
    return true;
    
  } catch (err) {
    console.error(`❌ 处理失败: ${path.relative(process.cwd(), filePath)}`);
    console.error(err);
    return false;
  }
}

function scanDirectory(dir) {
  let processedCount = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== '.vitepress' && file !== 'node_modules') {
        processedCount += scanDirectory(filePath);
      }
    } else if (file.endsWith('.md')) {
      if (removeHeaderFromFile(filePath)) {
        processedCount++;
      }
    }
  }
  
  return processedCount;
}

console.log('开始移除 docs-website 中文档的文头...\n');
const total = scanDirectory(DOCS_DIR);
console.log(`\n✅ 完成！共处理了 ${total} 个文件。`);
