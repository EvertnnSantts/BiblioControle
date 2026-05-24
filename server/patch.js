const fs = require('fs');
const path = require('path');

// Patch userController
const userPath = path.join(__dirname, 'src/controllers/userController.js');
let user = fs.readFileSync(userPath, 'utf8');

if (user.includes('Loan.count')) {
  console.log('userController.js já está atualizado ✅');
} else {
  user = user.replace(
    /await user\.destroy\(\);\r?\n\s+res\.json\(\{ success: true, message: 'Usuário deletado com sucesso' \}\);/,
    `const totalEmprestimos = await Loan.count({ where: { userId: id, status: 'ativo' } });\r\n    if (totalEmprestimos > 0) {\r\n      return res.status(400).json({ success: false, message: \`Não é possível excluir. Usuário possui \${totalEmprestimos} empréstimo(s) ativo(s).\` });\r\n    }\r\n    await user.destroy();\r\n    res.json({ success: true, message: 'Usuário deletado com sucesso' });`
  );
  fs.writeFileSync(userPath, user, 'utf8');
  console.log('userController.js ✅');
}

// Patch bookController
const bookPath = path.join(__dirname, 'src/controllers/bookController.js');
let book = fs.readFileSync(bookPath, 'utf8');

if (book.includes('Loan.count')) {
  console.log('bookController.js já está atualizado ✅');
} else {
  book = book.replace(
    /await book\.destroy\(\);\r?\n\s+res\.json\(\{ success: true, message: 'Livro deletado com sucesso' \}\);/,
    `const totalEmprestimos = await Loan.count({ where: { bookId: id, status: 'ativo' } });\r\n    if (totalEmprestimos > 0) {\r\n      return res.status(400).json({ success: false, message: \`Não é possível excluir. Livro possui \${totalEmprestimos} empréstimo(s) ativo(s).\` });\r\n    }\r\n    await book.destroy();\r\n    res.json({ success: true, message: 'Livro deletado com sucesso' });`
  );
  fs.writeFileSync(bookPath, book, 'utf8');
  console.log('bookController.js ✅');
}