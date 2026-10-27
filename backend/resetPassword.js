const bcrypt = require('bcrypt')

bcrypt.hash('NewPassword123',10)
.then(hash => console.log(hash))