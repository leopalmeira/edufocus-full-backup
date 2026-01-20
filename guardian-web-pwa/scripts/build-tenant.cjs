const fs = require('fs');
const path = require('path');

const tenant = process.argv[2];

if (!tenant) {
    console.error('❌ Por favor, informe o tenant. Ex: node scripts/build-tenant.cjs euclides');
    process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const tenantPath = path.join(rootDir, 'tenants', tenant);
const brandingPath = path.join(tenantPath, 'branding.json');

if (!fs.existsSync(brandingPath)) {
    console.error(`❌ Configurações do tenant "${tenant}" não encontradas em ${brandingPath}`);
    process.exit(1);
}

const branding = JSON.parse(fs.readFileSync(brandingPath, 'utf8'));

// 1. Atualizar manifest.json
const manifestPath = path.join(rootDir, 'public/manifest.json');
if (fs.existsSync(manifestPath)) {
    let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    manifest.name = branding.appName || manifest.name;
    manifest.short_name = branding.appShortName || manifest.short_name;
    manifest.description = branding.description || manifest.description;
    manifest.theme_color = branding.themeColor || manifest.themeColor;
    manifest.background_color = branding.backgroundColor || manifest.background_color;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
    console.log(`✅ [MANIFEST] Atualizado para: ${manifest.name}`);
}

// 2. Injetar Configuração no index.html
const indexPath = path.join(rootDir, 'index.html');
if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    const forcedTenantScript = `
    <!-- TENANT CONFIG AUTO-GENERATED -->
    <script id="tenant-config">
        window.FORCED_TENANT = "${tenant}";
        console.log("🏫 App White Label: ${branding.appName}");
    </script>
`;

    // Substituir ou Inserir script
    if (indexContent.includes('id="tenant-config"')) {
        indexContent = indexContent.replace(/<script id="tenant-config">[\s\S]*?<\/script>/, forcedTenantScript.replace('<!-- TENANT CONFIG AUTO-GENERATED -->', '').trim());
    } else {
        indexContent = indexContent.replace('<body>', `<body>\n${forcedTenantScript}`);
    }

    // Opcional: Atualizar o <title> estático
    indexContent = indexContent.replace(/<title>.*?<\/title>/, `<title>${branding.appName}</title>`);

    // Opcional: Atualizar a meta theme-color
    indexContent = indexContent.replace(/<meta name="theme-color" content=".*?">/, `<meta name="theme-color" content="${branding.themeColor}">`);

    fs.writeFileSync(indexPath, indexContent);
    console.log(`✅ [INDEX.HTML] Customizado com sucesso.`);
}

// 3. Copiar Ativos (Se existirem na pasta do tenant)
const assetsToCopy = [
    { from: 'logo.png', to: 'public/logo-tenant.png' },
    { from: 'icon.png', to: 'public/icon-192.png' },
    { from: 'icon.png', to: 'public/favicon.ico' } // Simplificado para exemplo
];

assetsToCopy.forEach(asset => {
    const src = path.join(tenantPath, asset.from);
    const dest = path.join(rootDir, asset.to);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`📂 [ASSET] Copiado: ${asset.from} -> ${asset.to}`);
    }
});

console.log(`\n🚀 BUILD COMPLETO PARA [${tenant.toUpperCase()}]`);
console.log(`Próximo passo: npm run build`);
