const bcrypt = require('bcrypt');
const hash = '$2b$10$leAFe8.SdrwfeQZnACZ9cunt7Ns59yKEJJuvw5oMyGNP2BDNjHsJy';
bcrypt.hash('82937061', 10).then(h => console.log('novo hash:', h));