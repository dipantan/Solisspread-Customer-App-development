const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const srcDir = path.join(projectRoot, 'src');

const screensMap = {
  // auth
  'SplashScreen.tsx': 'auth',
  'OnboardingScreen.tsx': 'auth',
  'LoginScreen.tsx': 'auth',
  'RegisterScreen.tsx': 'auth',
  'OTPScreen.tsx': 'auth',
  'CompleteProfileScreen.tsx': 'auth',
  'ProfileSuccessScreen.tsx': 'auth',
  'ChangePasswordScreen.tsx': 'auth',
  // e-commerce
  'ShopScreen.tsx': 'e-commerce',
  'CategoriesScreen.tsx': 'e-commerce',
  'PackagesScreen.tsx': 'e-commerce',
  'ProductsScreen.tsx': 'e-commerce',
  'ProductDetailsScreen.tsx': 'e-commerce',
  'CartScreen.tsx': 'e-commerce',
  'CheckoutScreen.tsx': 'e-commerce',
  'PaymentReviewScreen.tsx': 'e-commerce',
  'OrderHistoryScreen.tsx': 'e-commerce',
  'TrackOrderScreen.tsx': 'e-commerce',
  'OrderDetailsScreen.tsx': 'e-commerce',
  // amc-services
  'AmcScreen.tsx': 'amc-services',
  'BuyAmcScreen.tsx': 'amc-services',
  'AmcDetailsScreen.tsx': 'amc-services',
  'AmcRequestStatusScreen.tsx': 'amc-services',
  'RequestServiceScreen.tsx': 'amc-services',
  'ServiceRequestListScreen.tsx': 'amc-services',
  'ServiceRequestDetailsScreen.tsx': 'amc-services',
  // support
  'HelpCenterScreen.tsx': 'support',
  'FaqsScreen.tsx': 'support',
  'SupportTicketsScreen.tsx': 'support',
  'CreateTicketScreen.tsx': 'support',
  'TicketDetailsScreen.tsx': 'support',
  'GrievanceRedressalScreen.tsx': 'support',
  // profile
  'EditProfileScreen.tsx': 'profile',
  'SecurityScreen.tsx': 'profile',
  'SavedAddressesScreen.tsx': 'profile',
  'PrivacyCenterScreen.tsx': 'profile',
  'RequestDataScreen.tsx': 'profile',
  'ConsentManagementScreen.tsx': 'profile',
  'DeactivateAccountScreen.tsx': 'profile',
  'DeleteAccountScreen.tsx': 'profile',
  // referral
  'ReferAndEarnScreen.tsx': 'referral',
  'ReferralHistoryScreen.tsx': 'referral',
  // legal
  'AboutUsScreen.tsx': 'legal',
  'TermsScreen.tsx': 'legal',
  'PrivacyPolicyScreen.tsx': 'legal',
  // core
  'HomeScreen.tsx': 'core',
  'SearchScreen.tsx': 'core',
  'FilterScreen.tsx': 'core',
  'SolarCalculatorScreen.tsx': 'core'
};

const componentsMap = {
  'CategoryCard.tsx': 'e-commerce',
  'PackageCard.tsx': 'e-commerce',
  'ProductCard.tsx': 'e-commerce',
  'OTPBackConfirmationModal.tsx': 'auth',
  'OtpVerificationModal.tsx': 'auth',
};

const allFiles = []; 

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      collectFiles(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      allFiles.push(fullPath);
    }
  }
}

collectFiles(srcDir);
const appTsxPath = path.join(projectRoot, 'App.tsx');
if (fs.existsSync(appTsxPath)) allFiles.push(appTsxPath);

const movePlan = {};
const newPathToOld = {};

for (const f of allFiles) {
  let newPath = f;
  const basename = path.basename(f);
  
  if (f.includes(path.join('src', 'screens')) && screensMap[basename]) {
    newPath = path.join(projectRoot, 'src', 'screens', screensMap[basename], basename);
  } else if (f.includes(path.join('src', 'components')) && basename.endsWith('.tsx')) {
    // Check if it's not a directory and doesn't belong to a subdirectory already?
    // Let's assume all .tsx files directly in components/ move
    if (path.dirname(f) === path.join(projectRoot, 'src', 'components')) {
      const folder = componentsMap[basename] || 'common';
      newPath = path.join(projectRoot, 'src', 'components', folder, basename);
    }
  }
  
  if (newPath !== f) {
    movePlan[f] = newPath;
    newPathToOld[newPath] = f;
  }
}

const updatedContents = {};

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const targetLocation = movePlan[file] || file;
  const targetDir = path.dirname(targetLocation);

  const importRegex = /(?:from\s+|import\s+)['"]([^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    if (!importPath.startsWith('.')) return match;
    const oldDir = path.dirname(file);
    let resolvedAbsPath = path.resolve(oldDir, importPath);
    
    let targetOldAbsPath = null;
    for (const ext of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
      const checkPath = resolvedAbsPath + ext;
      if (fs.existsSync(checkPath) && fs.statSync(checkPath).isFile()) {
        targetOldAbsPath = checkPath;
        if (ext.startsWith('/index')) {
          targetOldAbsPath = resolvedAbsPath; // keep directory path
        }
        break;
      }
    }
    
    if (targetOldAbsPath) {
      let actualOldPath = targetOldAbsPath;
      if (fs.statSync(actualOldPath).isDirectory()) {
          actualOldPath = path.join(actualOldPath, 'index.ts');
      }
      const targetNewAbsPath = movePlan[actualOldPath] || targetOldAbsPath;
      let newRel = path.relative(targetDir, targetNewAbsPath).replace(/\\/g, '/');
      newRel = newRel.replace(/\.tsx?$/, '');
      if (!newRel.startsWith('.')) newRel = './' + newRel;
      return match.replace(importPath, newRel);
    }
    return match;
  });

  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  content = content.replace(requireRegex, (match, requirePath) => {
    if (!requirePath.startsWith('.')) return match;
    const oldDir = path.dirname(file);
    let resolvedAbsPath = path.resolve(oldDir, requirePath);
    
    if (fs.existsSync(resolvedAbsPath)) {
      let newRel = path.relative(targetDir, resolvedAbsPath).replace(/\\/g, '/');
      if (!newRel.startsWith('.')) newRel = './' + newRel;
      return match.replace(requirePath, newRel);
    }
    return match;
  });

  updatedContents[file] = content;
}

for (const file of allFiles) {
  if (movePlan[file]) {
    fs.unlinkSync(file);
  }
}

for (const file of allFiles) {
  const targetLocation = movePlan[file] || file;
  const newDir = path.dirname(targetLocation);
  if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
  fs.writeFileSync(targetLocation, updatedContents[file], 'utf8');
}

console.log('Refactoring complete!');
