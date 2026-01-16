/**
 * WhatsApp Service usando Baileys
 * Envia notificações automáticas aos pais quando o aluno chega na escola
 * MULTI-TENANT: Cada escola tem sua própria instância e número WhatsApp
 * 
 * INSTALAÇÃO NECESSÁRIA:
 * npm install @whiskeysockets/baileys qrcode-terminal pino
 */

// Módulos que serão carregados dinamicamente
let makeWASocket, DisconnectReason, useMultiFileAuthState;

const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { generateArrivalCard } = require('./card-generator');

class WhatsAppService {
    constructor(schoolId) {
        this.schoolId = schoolId;
        this.sock = null;
        this.isConnected = false;
        this.qrCode = null;
        this.authFolder = path.join(__dirname, 'whatsapp-auth', `school-${schoolId}`);
    }

    /**
     * Restaura sessão do WhatsApp de variável de ambiente (para Render)
     */
    async restoreSessionFromEnv() {
        const envVarName = `WHATSAPP_SESSION_SCHOOL_${this.schoolId}_BASE64`;
        const sessionBase64 = process.env[envVarName];

        if (!sessionBase64) {
            console.log(`ℹ️  Variável ${envVarName} não encontrada. Usando autenticação local.`);
            return false;
        }

        try {
            console.log(`🔄 Restaurando sessão WhatsApp da variável de ambiente para Escola ${this.schoolId}...`);

            // Criar pasta de autenticação se não existir
            if (!fs.existsSync(this.authFolder)) {
                fs.mkdirSync(this.authFolder, { recursive: true });
            }

            // Decodificar base64
            const buffer = Buffer.from(sessionBase64, 'base64');

            // Salvar como arquivo temporário
            const tempFile = path.join(this.authFolder, '..', `temp-session-${this.schoolId}.tar.gz`);
            fs.writeFileSync(tempFile, buffer);

            // Extrair arquivos
            const { execSync } = require('child_process');
            try {
                execSync(`tar -xzf "${tempFile}" -C "${this.authFolder}"`, { stdio: 'inherit' });
            } catch (tarError) {
                // Tentar com unzip se tar falhar (pode ser zip no Windows)
                const tempZip = path.join(this.authFolder, '..', `temp-session-${this.schoolId}.zip`);
                fs.renameSync(tempFile, tempZip);
                execSync(`powershell Expand-Archive -Path "${tempZip}" -DestinationPath "${this.authFolder}" -Force`, { stdio: 'inherit' });
                fs.unlinkSync(tempZip);
            }

            // Limpar arquivo temporário
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }

            console.log(`✅ Sessão WhatsApp restaurada com sucesso para Escola ${this.schoolId}`);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao restaurar sessão do ambiente:`, error.message);
            return false;
        }
    }

    /**
     * Inicializa a conexão com WhatsApp
     */
    async initialize() {
        try {
            // Tentar restaurar sessão de variável de ambiente primeiro (para Render)
            await this.restoreSessionFromEnv();

            // Criar pasta de autenticação se não existir
            if (!fs.existsSync(this.authFolder)) {
                fs.mkdirSync(this.authFolder, { recursive: true });
            }

            // Carregar Baileys dinamicamente (ESM)
            if (!makeWASocket) {
                const baileys = await import('@whiskeysockets/baileys');
                makeWASocket = baileys.default;
                DisconnectReason = baileys.DisconnectReason;
                useMultiFileAuthState = baileys.useMultiFileAuthState;
            }

            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                logger: pino({ level: 'silent' }), // 'debug' para ver logs
                browser: ['EduFocus', 'Chrome', '1.0.0']
            });

            // Evento de atualização de conexão
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    console.log(`\n📱 QR Code gerado para Escola ${this.schoolId}! Escaneie com WhatsApp:`);
                    qrcode.generate(qr, { small: true });
                    this.qrCode = qr;
                }

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log(`❌ Conexão fechada (Escola ${this.schoolId}). Reconectando:`, shouldReconnect);

                    if (shouldReconnect) {
                        await this.initialize();
                    } else {
                        this.isConnected = false;
                    }
                } else if (connection === 'open') {
                    console.log(`✅ WhatsApp conectado com sucesso! (Escola ${this.schoolId})`);
                    this.isConnected = true;
                    this.qrCode = null;
                }
            });

            // Salvar credenciais quando atualizadas
            this.sock.ev.on('creds.update', saveCreds);

            return true;
        } catch (error) {
            console.error(`❌ Erro ao inicializar WhatsApp (Escola ${this.schoolId}):`, error.message);
            return false;
        }
    }

    /**
     * Formata número de telefone para WhatsApp
     * @param {string} phone - Número com DDD (ex: 11999999999)
     * @returns {string} - Número formatado (ex: 5511999999999@s.whatsapp.net)
     */
    formatPhoneNumber(phone) {
        // Remove caracteres não numéricos
        const cleaned = phone.replace(/\D/g, '');

        // Adiciona código do país (55 para Brasil) se não tiver
        const withCountryCode = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

        return `${withCountryCode}@s.whatsapp.net`;
    }

    /**
     * Envia mensagem de chegada do aluno para os pais
     * @param {Object} student - Dados do aluno
     * @param {string} student.name - Nome do aluno
     * @param {string} student.phone - Telefone dos pais
     * @param {string} schoolName - Nome da escola
     * @param {Date} arrivalTime - Horário de chegada
     */
    async sendArrivalNotification(student, schoolName, arrivalTime = new Date()) {
        // Verificação robusta: checar tanto isConnected quanto o socket
        const isSocketReady = !!(this.sock?.user);
        const isReady = this.isConnected || isSocketReady;

        if (!isReady) {
            console.warn('⚠️ WhatsApp não conectado. Notificação não enviada.');
            return { success: false, error: 'WhatsApp não conectado' };
        }

        try {
            const phoneNumber = this.formatPhoneNumber(student.phone);
            const time = arrivalTime.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const date = arrivalTime.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            const message = `╔═══════════════════════════
║  🎓 *${schoolName}*
╚═══════════════════════════

✅ *CHEGADA CONFIRMADA*

👤 *Aluno:* ${student.name}
${student.class_name ? `📚 *Turma:* ${student.class_name}` : ''}

📅 *${date}*
🕐 *${time}*

━━━━━━━━━━━━━━━━━━━━━━━
Seu filho(a) chegou com segurança! 😊`;

            // GERAR E ENVIAR CARD VISUAL COM FOTO DO ALUNO
            if (student.photo_url && student.photo_url.startsWith('data:image')) {
                try {
                    console.log(`🎨 Gerando card visual para ${student.name}...`);

                    // Gerar card HTML como imagem
                    const cardImage = await generateArrivalCard({
                        studentName: student.name,
                        studentPhoto: student.photo_url,
                        className: student.class_name,
                        schoolName: schoolName,
                        date: date,
                        time: time
                    });

                    console.log(`📸 Enviando card visual para WhatsApp...`);

                    // Enviar card como imagem (SEM TEXTO)
                    await this.sock.sendMessage(phoneNumber, {
                        image: cardImage
                    });

                    console.log(`✅ Card visual enviado para ${student.name} (${student.phone}) - Escola ${this.schoolId}`);

                } catch (cardError) {
                    console.log(`⚠️ Erro ao gerar card, enviando mensagem simples:`, cardError.message);
                    // Se falhar ao enviar foto, envia só o texto
                    await this.sock.sendMessage(phoneNumber, { text: message });
                    console.log(`✅ Mensagem simples enviada para ${student.name}`);
                }
            } else {
                // Enviar só mensagem (aluno não tem foto cadastrada)
                await this.sock.sendMessage(phoneNumber, { text: message });
                console.log(`✅ Notificação enviada para ${student.name} (${student.phone}) - Escola ${this.schoolId}`);
            }

            return {
                success: true,
                sentAt: arrivalTime,
                phone: student.phone
            };

        } catch (error) {
            console.error(`❌ Erro ao enviar notificação para ${student.name}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Envia mensagem de saída do aluno para os pais
     * @param {Object} student - Dados do aluno
     * @param {string} schoolName - Nome da escola
     * @param {Date} departureTime - Horário de saída
     */
    async sendDepartureNotification(student, schoolName, departureTime = new Date()) {
        // Verificação robusta: checar tanto isConnected quanto o socket
        const isSocketReady = !!(this.sock?.user);
        const isReady = this.isConnected || isSocketReady;

        if (!isReady) {
            console.warn('⚠️ WhatsApp não conectado. Notificação não enviada.');
            return { success: false, error: 'WhatsApp não conectado' };
        }

        try {
            const phoneNumber = this.formatPhoneNumber(student.phone);
            const time = departureTime.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const date = departureTime.toLocaleDateString('pt-BR');

            const message = `🏠 *Notificação de Saída - ${schoolName}*\n\n` +
                `Olá! Seu(a) filho(a) *${student.name}* saiu da escola.\n\n` +
                (student.class_name ? `📚 Turma: ${student.class_name}\n` : '') +
                `📅 Data: ${date}\n` +
                `🕐 Horário: ${time}\n\n` +
                `_Mensagem automática do sistema ${schoolName}_`;

            await this.sock.sendMessage(phoneNumber, { text: message });

            console.log(`✅ Notificação de saída enviada para ${student.name} (${student.phone}) - Escola ${this.schoolId}`);

            return {
                success: true,
                sentAt: departureTime,
                phone: student.phone
            };

        } catch (error) {
            console.error(`❌ Erro ao enviar notificação de saída para ${student.name}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verifica se o WhatsApp está conectado
     */
    getStatus() {
        // Verificação robusta: Se tem usuário autenticado no socket, está conectado
        const isSocketReady = !!(this.sock?.user);
        const finalStatus = this.isConnected || isSocketReady;

        return {
            connected: finalStatus,
            qrCode: this.qrCode,
            hasAuth: fs.existsSync(this.authFolder),
            schoolId: this.schoolId,
            // Debug info
            phone: this.sock?.user?.id?.split(':')[0]
        };
    }

    /**
     * Desconecta do WhatsApp
     */
    async disconnect() {
        if (this.sock) {
            await this.sock.logout();
            this.isConnected = false;
            console.log(`🔌 WhatsApp desconectado (Escola ${this.schoolId})`);
        }
    }

    /**
     * Inicia keep-alive para manter conexão sempre ativa
     * Verifica a cada 2 minutos e reconecta se necessário
     */
    startKeepAlive() {
        // Parar keep-alive anterior se existir
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }

        console.log(`🔄 Iniciando keep-alive ROBUSTO para Escola ${this.schoolId}...`);

        // Verificar conexão a cada 2 minutos (mais frequente)
        this.keepAliveInterval = setInterval(async () => {
            try {
                // Verificação dupla: flag isConnected E socket ativo
                const hasSocket = !!(this.sock?.user);
                const shouldBeConnected = this.isConnected || hasSocket;

                if (!shouldBeConnected) {
                    console.log(`⚠️  [KEEP-ALIVE] Escola ${this.schoolId} desconectada. Reconectando...`);
                    try {
                        await this.initialize();
                        console.log(`✅ [KEEP-ALIVE] Escola ${this.schoolId} reconectada com sucesso!`);
                    } catch (error) {
                        console.error(`❌ [KEEP-ALIVE] Erro ao reconectar Escola ${this.schoolId}:`, error.message);
                    }
                } else {
                    // Enviar ping para manter conexão ativa
                    try {
                        if (this.sock) {
                            await this.sock.fetchStatus('status@broadcast');
                            const now = new Date().toLocaleTimeString('pt-BR');
                            console.log(`✅ [KEEP-ALIVE] ${now} - Escola ${this.schoolId} online`);
                        }
                    } catch (error) {
                        console.log(`⚠️  [KEEP-ALIVE] Ping falhou para Escola ${this.schoolId}, marcando para reconexão...`);
                        this.isConnected = false;
                        // Tentar reconectar imediatamente
                        try {
                            await this.initialize();
                        } catch (reconnectError) {
                            console.error(`❌ [KEEP-ALIVE] Falha na reconexão imediata:`, reconnectError.message);
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ [KEEP-ALIVE] Erro no ciclo de keep-alive:`, error.message);
            }
        }, 2 * 60 * 1000); // 2 minutos (mais frequente que antes)

        console.log(`✅ Keep-alive configurado: verificação a cada 2 minutos`);
    }


    /**
     * Para o keep-alive
     */
    /**
     * Método genérico para enviar mensagem WhatsApp
     * @param {string} phoneNumber - Número no formato 5511987654321@s.whatsapp.net
     * @param {string} message - Texto da mensagem
     * @returns {Promise<boolean>} - true se enviou com sucesso
     */
    async sendMessage(phoneNumber, message) {
        // Verificar se está conectado
        const isSocketReady = !!(this.sock?.user);
        const isReady = this.isConnected || isSocketReady;

        if (!isReady || !this.sock) {
            console.warn(`⚠️ WhatsApp não conectado para Escola ${this.schoolId}`);
            throw new Error('WhatsApp não conectado');
        }

        try {
            console.log(`📤 Enviando mensagem para ${phoneNumber}...`);

            // Enviar mensagem usando Baileys
            await this.sock.sendMessage(phoneNumber, {
                text: message
            });

            console.log(`✅ Mensagem enviada com sucesso para ${phoneNumber}`);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao enviar mensagem para ${phoneNumber}:`, error.message);
            throw error;
        }
    }

    /**
     * Desconecta o WhatsApp e limpa a sessão
     * @returns {Promise<void>}
     */
    async disconnect() {
        try {
            console.log(`🔌 Desconectando WhatsApp para Escola ${this.schoolId}...`);

            // Parar keep-alive
            this.stopKeepAlive();

            // Desconectar socket se existir
            if (this.sock) {
                try {
                    await this.sock.logout();
                    console.log(`✅ Logout realizado para Escola ${this.schoolId}`);
                } catch (logoutError) {
                    console.log(`⚠️ Erro ao fazer logout (ignorando):`, logoutError.message);
                }

                // Fechar conexão
                this.sock.end();
                this.sock = null;
            }

            // Resetar estados
            this.isConnected = false;
            this.qrCode = null;

            // Deletar pasta de autenticação (limpar sessão)
            const fs = require('fs');
            if (fs.existsSync(this.authFolder)) {
                console.log(`🗑️ Removendo sessão salva: ${this.authFolder}`);
                fs.rmSync(this.authFolder, { recursive: true, force: true });
            }

            console.log(`✅ WhatsApp desconectado completamente para Escola ${this.schoolId}`);

        } catch (error) {
            console.error(`❌ Erro ao desconectar WhatsApp:`, error.message);
            // Mesmo com erro, resetar estados
            this.isConnected = false;
            this.qrCode = null;
            this.sock = null;
            throw error;
        }
    }

    stopKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
            console.log(`🛑 Keep-alive parado para Escola ${this.schoolId}`);
        }
    }
}

// Map de instâncias por escola (multi-tenant)
const whatsappInstances = new Map();

function getWhatsAppService(schoolId) {
    if (!schoolId) {
        throw new Error('schoolId é obrigatório para WhatsApp Service');
    }

    if (!whatsappInstances.has(schoolId)) {
        whatsappInstances.set(schoolId, new WhatsAppService(schoolId));
    }

    return whatsappInstances.get(schoolId);
}

module.exports = { WhatsAppService, getWhatsAppService };

