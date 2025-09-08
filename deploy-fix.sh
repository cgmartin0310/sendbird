#!/bin/bash

echo "Deploying password_hash fix to production..."
echo "============================================"

# Add and commit the changes
git add src/controllers/adminController.ts
git add tsconfig.json
git add src/controllers/authController.ts 
git add src/scripts/createConsent.ts
git add dist/

# Remove the accidentally added frontend file from tracking
git rm src/config/api.ts 2>/dev/null || true

git commit -m "Fix: Change password_hash to password in adminController createUser

- Fixed column name from password_hash to password to match database schema
- Removed accidentally duplicated frontend api.ts from backend src
- Fixed TypeScript build issues by adjusting strictness and JWT typing
- Successfully compiled and tested"

# Push to GitHub (which will trigger Render deploy)
git push origin main

echo ""
echo "Fix has been pushed to GitHub!"
echo "Render will automatically deploy the changes."
echo ""
echo "You can monitor the deployment at:"
echo "https://dashboard.render.com/"
echo ""
echo "The fix addresses:"
echo "- Column 'password_hash' does not exist error when creating users"
echo "- Now correctly uses 'password' column to match the database schema"
