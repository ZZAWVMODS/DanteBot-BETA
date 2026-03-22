const config = require('../../config');

module.exports = {
    name: "add",
    aliases: ["agregar", "invitar"],
    category: "admin",
    description: "Agrega un número de teléfono al grupo",

    run: async (socket, m, { args, from, isGroup, isAdmins, isOwner, sender }) => {
        // 1. Validar que sea un grupo
        if (!isGroup) return;

        try {
            // 2. Obtener metadatos y verificar permisos MANUALMENTE
            const metadata = await socket.groupMetadata(from);
            const participants = metadata.participants;
            
            // Obtener JID del bot correctamente
            const botNumber = socket.user?.id 
                ? (socket.user.id.includes(':') 
                    ? socket.user.id.split(':')[0] + '@s.whatsapp.net' 
                    : socket.user.id)
                : null;

            // Encontrar al bot en la lista de participantes
            const botParticipant = participants.find(p => p.id === botNumber || p.id.split(':')[0] + '@s.whatsapp.net' === botNumber);
            const isBotAdmin = botParticipant?.admin !== null;

            // 3. Validaciones de seguridad
            if (!isAdmins && !isOwner) {
                return await socket.sendMessage(from, { 
                    text: `*[!] Acceso Denegado*\n\n> *Razón:* \`Solo administradores pueden agregar miembros\`\n> *Solicitado por:* @${sender.split('@')[0]}\n\n*_Contacta con un admin si necesitas ayuda_*`,
                    mentions: [sender]
                }, { quoted: m });
            }

            if (!isBotAdmin) {
                return await socket.sendMessage(from, { 
                    text: `*[!] Permisos Insuficientes*\n\n> *Razón:* \`Necesito ser administrador para agregar miembros\`\n> *Mi número:* \`${botNumber?.split('@')[0] || 'Desconocido'}\`\n\n*_Otórgame el rol e intenta nuevamente_*`
                }, { quoted: m });
            }

            // 4. Validar entrada del número
            if (!args.length) {
                return await socket.sendMessage(from, { 
                    text: `*[!] Número Requerido*\n\n> *Uso:* \`${config.prefixes[0]}add *504××××××*\`\n> *Formatos aceptados:*\n> • \`*504××××××*\`\n> • \`*504 ××× ×××*\``
                }, { quoted: m });
            }

            // UNIR TODOS LOS ARGUMENTOS PARA CAPTURAR NÚMEROS CON ESPACIOS
            const fullNumberInput = args.join(' ');
            
            // LIMPIAR EL NÚMERO: eliminar TODO excepto dígitos
            let userToAdd = fullNumberInput.replace(/\D/g, '');
            
            // Validar que tenga al menos dígitos suficientes
            if (userToAdd.length < 8 || userToAdd.length > 15) {
                return await socket.sendMessage(from, { 
                    text: `*[!] Número Inválido*\n\n> *Ingresado:* \`${fullNumberInput}\`\n> *Formato:* \`${userToAdd}\`\n\n> *Debe incluir código de país*\n> *Ejemplos válidos:*\n> • \`+593 98 999 3745\` (Ecuador)\n> • \`+504 9622 8919\` (Honduras)\n> • \`+52 55 1234 5678\` (México)`
                }, { quoted: m });
            }

            const jidToAdd = `${userToAdd}@s.whatsapp.net`;

            // Detectar país del número
            const countryInfo = detectCountry(userToAdd);
            
            // Verificar si ya está en el grupo
            const userExists = participants.some(p => {
                const pNumber = p.id.split('@')[0].split(':')[0].replace(/\D/g, '');
                return pNumber === userToAdd;
            });

            if (userExists) {
                const formattedNumber = formatPhoneNumber(userToAdd);
                
                return await socket.sendMessage(from, { 
                    text: `*[!] Miembro Existente*\n\n> *Número:* \`${formattedNumber}\`\n> *País:* \`${countryInfo.pais}\`\n> *Código:* \`+${countryInfo.codigo}\`\n\n> *Este número ya forma parte del grupo.*`
                }, { quoted: m });
            }

            await socket.sendMessage(from, { react: { text: "➕️", key: m.key } });

            // 5. Intentar agregar
            try {
                const response = await socket.groupParticipantsUpdate(from, [jidToAdd], "add");

                const formattedNumber = formatPhoneNumber(userToAdd);

                // 6. Manejar la respuesta
                if (response[0]?.status === "403") {
                    await socket.sendMessage(from, { react: { text: "📩", key: m.key } });
                    
                    // Generar link de invitación como alternativa
                    let inviteLink = "";
                    try {
                        const inviteCode = await socket.groupInviteCode(from);
                        inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
                    } catch {}
                    
                    return await socket.sendMessage(from, { 
                        text: `*[!] Privacidad Restringida*\n\n> *Número:* \`${formattedNumber}\`\n> *País:* \`${countryInfo.pais}\`\n> *Código:* \`+${countryInfo.codigo}\`\n\n> *El usuario tiene configurada su privacidad*\n> *No es posible agregarlo directamente.*\n\n*_Link de invitación:_*\n> \`${inviteLink || 'No se pudo generar'}\``
                    }, { quoted: m });
                } 
                
                if (response[0]?.status === "200") {
                    await socket.sendMessage(from, { react: { text: "✔️", key: m.key } });
                    
                    return await socket.sendMessage(from, { 
                        text: `*[✓] Operación Exitosa*\n\n> *Número:* \`${formattedNumber}\`\n> *País:* \`${countryInfo.pais}\`\n> *Código:* \`+${countryInfo.codigo}\`\n\n> *Usuario agregado correctamente al grupo*\n\n*_Solicitado por: @${sender.split('@')[0]}_*\n> *Fecha:* \`${new Date().toLocaleDateString('es-ES')}\``,
                        mentions: [jidToAdd, sender]
                    }, { quoted: m });
                }

                throw new Error("`No se pudo agregar`");

            } catch (addError) {
                console.error('Error en groupParticipantsUpdate:', addError);
                await socket.sendMessage(from, { react: { text: "✖️", key: m.key } });
                
                const formattedNumber = formatPhoneNumber(userToAdd);
                let errorDetail = "*El número no existe en WhatsApp o es inválido.*";
                
                if (addError.message?.includes('403')) {
                    errorDetail = "*El usuario tiene la privacidad activada.*";
                } else if (addError.message?.includes('409')) {
                    errorDetail = "*El número ya está en el grupo.*";
                } else if (addError.message?.includes('408')) {
                    errorDetail = "*Tiempo de espera agotado.*";
                }
                
                return await socket.sendMessage(from, { 
                    text: `*[!] Error en la Operación*\n\n> *Número:* \`${formattedNumber}\`\n> *País:* \`${countryInfo.pais}\`\n> *Código:* \`+${countryInfo.codigo}\`\n\n> ${errorDetail}\n*_Verifica el número e intenta nuevamente_*`
                }, { quoted: m });
            }

        } catch (error) {
            console.error('Error en comando add:', error);
            await socket.sendMessage(from, { 
                text: `*[!] Error Interno*\n\n> *Razón:* \`Ocurrió una falla inesperada\`\n> *Por favor, intenta nuevamente.*`
            }, { quoted: m });
        }
    }
};

// FUNCIÓN PARA DETECTAR PAÍS POR CÓDIGO
function detectCountry(number) {
    const codigo = number.slice(0, 3); // Primeros 3 dígitos como aproximación
    
    const paises = {
        '504': { pais: 'Honduras', codigo: '504' },
        '503': { pais: 'El Salvador', codigo: '503' },
        '505': { pais: 'Nicaragua', codigo: '505' },
        '506': { pais: 'Costa Rica', codigo: '506' },
        '507': { pais: 'Panamá', codigo: '507' },
        '502': { pais: 'Guatemala', codigo: '502' },
        '501': { pais: 'Belice', codigo: '501' },
        '52': { pais: 'México', codigo: '52' },
        '57': { pais: 'Colombia', codigo: '57' },
        '58': { pais: 'Venezuela', codigo: '58' },
        '51': { pais: 'Perú', codigo: '51' },
        '56': { pais: 'Chile', codigo: '56' },
        '54': { pais: 'Argentina', codigo: '54' },
        '55': { pais: 'Brasil', codigo: '55' },
        '593': { pais: 'Ecuador', codigo: '593' },
        '591': { pais: 'Bolivia', codigo: '591' },
        '595': { pais: 'Paraguay', codigo: '595' },
        '598': { pais: 'Uruguay', codigo: '598' },
        '34': { pais: 'España', codigo: '34' },
        '1': { pais: 'Estados Unidos/Canadá', codigo: '1' },
        '44': { pais: 'Reino Unido', codigo: '44' },
        '39': { pais: 'Italia', codigo: '39' },
        '49': { pais: 'Alemania', codigo: '49' },
        '33': { pais: 'Francia', codigo: '33' },
        '351': { pais: 'Portugal', codigo: '351' },
        '54': { pais: 'Argentina', codigo: '54' },
        '56': { pais: 'Chile', codigo: '56' },
    };
    
    // Buscar coincidencia exacta de 3 dígitos
    if (paises[codigo]) {
        return paises[codigo];
    }
    
    // Buscar coincidencia de 2 dígitos
    const dosDigitos = number.slice(0, 2);
    if (paises[dosDigitos]) {
        return paises[dosDigitos];
    }
    
    // Buscar coincidencia de 1 dígito
    const unDigito = number.slice(0, 1);
    if (paises[unDigito]) {
        return paises[unDigito];
    }
    
    return { pais: 'Desconocido', codigo: number.slice(0, 3) };
}

// FUNCIÓN PARA FORMATEAR NÚMEROS DE TELÉFONO
function formatPhoneNumber(number) {
    // Eliminar cualquier carácter no numérico por si acaso
    number = number.replace(/\D/g, '');
    
    if (number.length === 12) {
        return `+${number.slice(0,3)} ${number.slice(3,5)} ${number.slice(5,8)} ${number.slice(8)}`;
    } else if (number.length === 11) {
        return `+${number.slice(0,2)} ${number.slice(2,4)} ${number.slice(4,7)} ${number.slice(7)}`;
    } else if (number.length === 10) {
        return `+${number.slice(0,1)} ${number.slice(1,4)} ${number.slice(4,7)} ${number.slice(7)}`;
    } else if (number.length === 13) {
        return `+${number.slice(0,3)} ${number.slice(3,6)} ${number.slice(6,9)} ${number.slice(9)}`;
    }
    
    return `+${number}`;
}