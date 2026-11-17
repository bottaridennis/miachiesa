const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  /allow update: if \(isOwner\(userId\) && !request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasAny\(\['isAdmin'\]\)\) \|\| isSuperAdmin\(\);/g,
  "allow update: if isSuperAdmin() || (isOwner(userId) && (!request.resource.data.keys().hasAny(['isAdmin']) || request.resource.data.isAdmin == resource.data.isAdmin));"
);
fs.writeFileSync('firestore.rules', rules);
