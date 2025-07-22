// update-script.js
const { google } = require('googleapis');
const fs = require('fs');

// Configuración
const SHEET_ID = '1RJfKFkExshP_awf-pZclViEBX6KkeEy6aKuUm38roevG4g_GwTOpfmHKWOQALetnyKZ14a7tA5OCiH'; // ID de tu hoja de cálculo
const KEYFILE_PATH = './credentials.json'; // Ruta al archivo de credenciales JSON

// --- LÓGICA DE PARSEO Y GENERACIÓN (similar a la que ya teníamos) ---

const mapColorToStatus = (hexColor) => {
    const map = {
        '#b6d7a8': 'p', '#d9ead3': 'q', '#fce5cd': 'interrogante',
        '#f6b26b': 's', '#e06666': 'x', '#ff99cc': 'r', '#ff00ff': 'r'
    };
    return map[hexColor] || 'desconocido';
};

const getFlagUrl = (emoji) => {
    const map = { '🇪🇸': 'es', '🇫🇷': 'fr', '🇬🇧': 'gb', '🇮🇹': 'it', '🇶🇦': 'qa', '🇮🇪': 'ie', '🇩🇰': 'dk', '🏴󠁧󠁢󠁳󠁣󠁴󠁿': 'gb-sct', '🇷🇴': 'ro', '🇸🇰': 'sk', '🇵🇹': 'pt', '🇪🇪': 'ee', '🇸🇪': 'se', '🇩🇪': 'de', '🇦🇷': 'ar', '🇨🇱': 'cl', '🇫🇮': 'fi', '🇸🇦': 'sa' };
    return map[emoji] ? `https://flagcdn.com/w40/${map[emoji]}.png` : '';
};

const generateTeamHTML = (teams) => {
    return teams.map(team => {
        const renderColumn = (players) => players.map(player => {
            const flagHTML = player.nationality ? (getFlagUrl(player.nationality) ? `<img src="${getFlagUrl(player.nationality)}" alt="${player.nationality}" class="w-5 h-auto">` : `<span>${player.nationality}</span>`) : '';
            return `<div class="player-row flex items-center justify-between text-sm border-b border-zinc-800 py-1">
                        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm status-${player.status}"></div><span class="player-name ${player.status === 'x' ? 'text-red-400 line-through' : ''}">${player.name}</span></div>
                        <div class="flex items-center gap-2 text-slate-400">${player.staff ? `<span class="font-bold text-xs">${player.staff}</span>` : ''}${flagHTML}</div>
                    </div>`;
        }).join('');

        return `<div class="team-card bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
                    <h3 class="team-name font-orbitron text-white text-lg text-center ${team.name.includes('?') ? 'bg-zinc-700' : 'bg-orange-500'} py-2">${team.name}</h3>
                    <div class="p-3 flex-grow"><div class="grid grid-cols-2 gap-x-4">
                        <div class="space-y-2">${renderColumn(team.players.left)}</div>
                        <div class="space-y-2">${renderColumn(team.players.right)}</div>
                    </div></div>
                </div>`;
    }).join('');
};

const generateLftHTML = (lftData) => {
    if (!lftData || (lftData.Regionales.length === 0 && lftData['No Regionales'].length === 0)) return '';
    const regionalPlayers = lftData.Regionales.map(p => `<p><span class="font-semibold text-orange-400">${p.name}</span> - ${p.role}</p>`).join('') || '<p class="text-slate-500">N/A</p>';
    const nonRegionalPlayers = lftData['No Regionales'].map(p => `<p><span class="font-semibold text-orange-400">${p.name}</span> - ${p.role}</p>`).join('') || '<p class="text-slate-500">N/A</p>';
    return `<h2 class="text-4xl font-orbitron font-bold text-white text-center mb-8">Jugadores LFT</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm max-w-4xl mx-auto"><div class="bg-zinc-900 p-4 rounded-lg border border-zinc-800"><h3 class="font-orbitron text-white text-lg mb-3 text-center bg-zinc-800 py-1 rounded">Regionales</h3><div class="lft-list space-y-2">${regionalPlayers}</div></div><div class="bg-zinc-900 p-4 rounded-lg border border-zinc-800"><h3 class="font-orbitron text-white text-lg mb-3 text-center bg-zinc-800 py-1 rounded">No Regionales</h3><div class="lft-list space-y-2">${nonRegionalPlayers}</div></div></div>`;
};

const generateFullHTML = (teamsHTML, lftHTML) => {
    // Plantilla completa de tu archivo HTML
    return `<!DOCTYPE html>
    <html lang="es" class="scroll-smooth">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mercato Off-Season - OW Andromeda</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
        <style>
        .font-orbitron { font-family: 'Orbitron', sans-serif; } .font-inter { font-family: 'Inter', sans-serif; } .main-bg { background-color: #0a0a0a; }
        .status-f { background-color: #3b82f6; } .status-p { background-color: #22c55e; } .status-q { background-color: #84cc16; } .status-interrogante { background-color: #f59e0b; } .status-s { background-color: #d97706; } .status-x { background-color: #ef4444; } .status-r { background-color: #ec4899; } .status-t { background-color: #a855f7; } .status-desconocido { background-color: #a1a1aa; }
        </style>
        </head>
        <body class="bg-zinc-950 text-slate-200 font-inter">
        <header id="header" class="bg-zinc-950/80 backdrop-blur-sm sticky top-0 left-0 w-full z-50 transition-all duration-300">
        <nav class="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="index.html" class="text-2xl font-orbitron font-bold text-white">OW<span class="text-orange-500">A</span></a>
        <div class="hidden md:flex items-center space-x-8">
        <a href="index.html" class="hover:text-orange-500 transition-colors">Inicio</a><a href="partidos.html" class="hover:text-orange-500 transition-colors">Partidos</a><a href="clasificacion.html" class="hover:text-orange-500 transition-colors">Clasificación</a><a href="#" class="text-orange-500 font-bold">Mercato</a><a href="normativa.html" class="hover:text-orange-500 transition-colors">Normativa</a>
        </div>
        <a href="https://www.faceit.com/es/championship/63f68d66-d67e-4a2b-a655-4ba8c18214dd/Season%2520II" target="_blank" class="hidden md:block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 transform hover:scale-105">Inscríbete</a>
        <button id="mobile-menu-button" class="md:hidden text-white focus:outline-none"><i class="ph-fill ph-list text-3xl"></i></button>
        </nav>
        <div id="mobile-menu" class="hidden md:hidden bg-zinc-900">
        <a href="index.html" class="block py-2 px-4 hover:bg-zinc-800 hover:text-orange-500">Inicio</a><a href="partidos.html" class="block py-2 px-4 hover:bg-zinc-800 hover:text-orange-500">Partidos</a><a href="clasificacion.html" class="block py-2 px-4 hover:bg-zinc-800 hover:text-orange-500">Clasificación</a><a href="#" class="block py-2 px-4 bg-zinc-800 text-orange-500 font-bold">Mercato</a><a href="normativa.html" class="block py-2 px-4 hover:bg-zinc-800 hover:text-orange-500">Normativa</a><a href="https://www.faceit.com/es/championship/63f68d66-d67e-4a2b-a655-4ba8c18214dd/Season%2520II" target="_blank" class="block text-center py-4 px-4 bg-orange-500 text-white font-bold">Inscríbete</a>
        </div>
        </header>
        <main class="main-bg pt-20 pb-20">
        <div class="container mx-auto px-12">
        <div class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-orbitron font-bold text-white">Mercato Off-Season</h1>
        <p class="mt-4 max-w-3xl mx-auto text-slate-400">Sigue todos los movimientos, fichajes y rumores de los equipos de OW Andromeda.</p>
        </div>
        <div id="content-container">
        <div id="teams-grid" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">${teamsHTML}</div>
        <div id="lft-section" class="mt-16">${lftHTML}</div>
        </div>
        </div>
        </main>
        <button id="legend-toggle-btn" class="fixed top-1/2 right-0 -translate-y-1/2 bg-orange-500 text-white p-3 rounded-l-lg shadow-lg z-40 transform hover:scale-110 transition-transform"><i class="ph-fill ph-info text-2xl"></i></button>
        <div id="legend-sidebar" class="fixed top-0 right-0 h-full w-[500px] max-w-full bg-zinc-900 border-l-2 border-orange-500 shadow-2xl z-[60] transform translate-x-full transition-transform duration-300 ease-in-out"></div>
        <div id="overlay" class="hidden fixed inset-0 bg-black/60 z-50"></div>
        <footer class="bg-black py-10"><div class="container mx-auto px-6 text-center text-slate-500"><div class="mb-10"><h3 class="text-sm uppercase tracking-widest text-slate-400 mb-6">Nuestros patrocinadores</h3><div class="flex justify-center items-center gap-8 opacity-60"><img src="assets/img/FACEIT.png" alt="FACEIT Logo" class="h-8 filter grayscale hover:grayscale-0 transition-all duration-300"></div></div><div class="flex justify-center space-x-6 mt-6"><a href="https://twitter.com/OWAndromedaes" target="_blank" class="hover:text-orange-500 transition-colors"><i class="ph-fill ph-twitter-logo text-2xl"></i></a><a href="https://www.twitch.tv/owandromedaes" target="_blank" class="hover:text-orange-500 transition-colors"><i class="ph-fill ph-twitch-logo text-2xl"></i></a><a href="https://discord.com/owandromeda" target="_blank" class="hover:text-orange-500 transition-colors"><i class="ph-fill ph-discord-logo text-2xl"></i></a></div><p class="mt-4 text-sm">&copy; 2024 OW Andromeda. Todos los derechos reservados.</p><p class="mt-2 text-xs">Overwatch es una marca registrada de Blizzard Entertainment, Inc. Esta liga no está afiliada ni respaldada por Blizzard Entertainment.</p></div></footer>
        <script>
        // Script para funcionalidades del front-end como el menú móvil y la leyenda
        document.addEventListener('DOMContentLoaded', () => {
        function renderLegend() {
        const legendSidebar = document.getElementById('legend-sidebar');
        if (!legendSidebar) return;
        legendSidebar.innerHTML = \`<div class="p-6 h-full overflow-y-auto"><div class="flex justify-between items-center mb-6"><h2 class="font-orbitron text-white text-2xl">Leyenda</h2><button id="close-legend-btn" class="text-slate-400 hover:text-white"><i class="ph-fill ph-x text-2xl"></i></button></div><div class="space-y-6"><div class="grid grid-cols-2 gap-4"><div class="bg-zinc-800 p-4 rounded-lg"><h3 class="font-orbitron text-orange-400 text-lg mb-3">Prob. (actual)</h3><div class="space-y-2 text-sm"><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-p mr-2"></div><span>>90% probable</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-q mr-2"></div><span>Propenso a quedarse</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-interrogante mr-2"></div><span>No info / Posibilidad</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-s mr-2"></div><span>Apunta a salir</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-x mr-2"></div><span>Salida</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-r mr-2"></div><span>Rumor</span></div></div></div><div class="bg-zinc-800 p-4 rounded-lg"><h3 class="font-orbitron text-orange-400 text-lg mb-3">Prob. (fichaje)</h3><div class="space-y-2 text-sm"><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-f mr-2"></div><span>Firmado*</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-p mr-2"></div><span>>90% probable*</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-q mr-2"></div><span>Propenso a llegar*</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-interrogante mr-2"></div><span>Posibilidad*</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-s mr-2"></div><span>Improbable*</span></div><div class="flex items-center"><div class="w-4 h-4 rounded-sm status-t mr-2"></div><span>Tryouts</span></div></div></div></div><div class="bg-zinc-800 p-4 rounded-lg"><h3 class="font-orbitron text-orange-400 text-lg mb-3">Staff</h3><div class="space-y-2 text-sm"><div class="flex items-center"><span class="font-bold w-8">HC</span><span>Head Coach</span></div><div class="flex items-center"><span class="font-bold w-8">AC</span><span>Assistant Coach</span></div><div class="flex items-center"><span class="font-bold w-8">M</span><span>Manager</span></div></div></div></div></div>\`;
        }
        renderLegend();
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        const legendToggleBtn = document.getElementById('legend-toggle-btn');
        const overlay = document.getElementById('overlay');
        const legendSidebar = document.getElementById('legend-sidebar');
        const toggleLegend = () => {
        overlay.classList.toggle('hidden');
        legendSidebar.classList.toggle('translate-x-full');
        };
        legendToggleBtn.addEventListener('click', toggleLegend);
        legendSidebar.addEventListener('click', (e) => { if(e.target.id === 'close-legend-btn' || e.target.closest('#close-legend-btn')) { toggleLegend(); } });
        overlay.addEventListener('click', toggleLegend);
        });
        <\/script>
        </body>
        </html>`;
        };
        // --- FUNCIÓN PRINCIPAL ---
async function main() {
    try {
        console.log('Autenticando con Google...');
        const auth = new google.auth.GoogleAuth({
            keyFile: KEYFILE_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });

        console.log('Obteniendo datos de la hoja de cálculo...');
        const response = await sheets.spreadsheets.get({
            spreadsheetId: SHEET_ID,
            ranges: ['Sheet1'],
            includeGridData: true,
        });
        
        const gridData = response.data.sheets[0].data[0];
        const rows = gridData.rowData.map(row => row.values || []);

        const teamsData = [];
        const lftData = { Regionales: [], 'No Regionales': [] };
        let currentTeam = null;
        let parsingMode = 'teams';
        let currentLftCategory = null;

        console.log('Procesando filas...');
        for (const row of rows) {
            if (row.length === 0) continue;

            const firstCellText = row[0]?.formattedValue || '';
            if (firstCellText.includes('Jugadores LFT')) {
                parsingMode = 'lft'; continue;
            }

            if (parsingMode === 'teams') {
                 if (row.length > 1 && row[1]?.formattedValue) {
                     const teamName = row[1].formattedValue;
                     currentTeam = { name: teamName, players: { left: [], right: [] } };
                     teamsData.push(currentTeam);
                 } else if (currentTeam && row.length > 1) {
                    const playerLeft = parseCellData(row[0], row[1]);
                    if(playerLeft) currentTeam.players.left.push(playerLeft);
                    
                    const playerRight = parseCellData(row[3], row[4]);
                    if(playerRight) currentTeam.players.right.push(playerRight);
                 }
            } else if (parsingMode === 'lft') {
                if (firstCellText === 'Regionales' || firstCellText === 'No Regionales') {
                    currentLftCategory = firstCellText;
                } else if (currentLftCategory && firstCellText && row.length > 1) {
                    lftData[currentLftCategory].push({ name: firstCellText, role: row[1]?.formattedValue || '' });
                }
            }
        }
        
        function parseCellData(statusCell, nameCell){
             if (!nameCell || !nameCell.formattedValue) return null;
             const {r, g, b} = statusCell?.effectiveFormat?.backgroundColor || {r:0,g:0,b:0};
             // El API devuelve colores en escala 0-1, hay que convertirlos a 0-255
             const hexColor = `#${Math.round(r*255).toString(16).padStart(2,'0')}${Math.round(g*255).toString(16).padStart(2,'0')}${Math.round(b*255).toString(16).padStart(2,'0')}`;

             const nationalityMatch = nameCell.formattedValue.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
             const nationality = nationalityMatch ? nationalityMatch[0] : '👽';
             let name = nameCell.formattedValue.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u, '').trim();
             let staff = null;
             if (/\s(M|HC|AC)$/.test(name)) {
                staff = name.slice(-2).trim();
                name = name.slice(0, -3).trim();
             }

             return {
                 name,
                 nationality,
                 staff,
                 status: mapColorToStatus(hexColor)
             };
        }

        console.log('Generando archivos HTML...');
        const teamsHTML = generateTeamHTML(teamsData);
        const lftHTML = generateLftHTML(lftData);
        const fullHTML = generateFullHTML(teamsHTML, lftHTML);

        fs.writeFileSync('mercado.html', fullHTML, 'utf-8');
        console.log('¡Éxito! El archivo mercado.html ha sido actualizado.');

    } catch (error) {
        console.error('Error durante la ejecución del script:', error);
        process.exit(1); // Salir con un código de error
    }
}

main();