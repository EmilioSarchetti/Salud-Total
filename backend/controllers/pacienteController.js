const db = require('../models/db');
//hashing de la contraseña
const bycrypt = require('bcrypt');

exports.solicitarTurno = (req,res) => {
    const {paciente_id, medico_id, especiealidad_id, fecha, hora, detalles} = req.body;

    if(!paciente_id || !medico_id || !especiealidad_id || !fecha || !hora){
        return res.status(400).json({mensaje: 'Faltan campos obligatorios para solicitar el turno.'});
    }
    
    const horaNormalizada = hora.includes(':') && hora.length === 5 ? `${hora}:00` : hora;

    const verificarSql = `
    SELECT *FROM turnos
    WHERE medico_id = ? AND fecha = ? AND hora = ? AND estado != 'cancelado' 
    `;

    db.query(verificarSql, [medico_id, fecha, horaNormalizada], (err, resultados) =>{
        if (err){
            console.error('Error al verificar disponibilidad: ', err);
            return res.status(500).json({mensaje: 'Error al verificar disponibilidad.'});
        }
        if (resultados.length > 0){
            return res.status(409).json({mensaje: 'Este turno ya está reservado.'});
        }

        const insertarSql= `
        INSERT INTO turnos (paciente_id, medico_id, especialidad_id, fecha, hora, detalles, estado)
        VALUES (?, ?, ?, ?, ?, ?, 'en espera')`;

        db.query(
            insertSql,
            [paciente_id, medico_id, especiealidad_id, fecha, horaNormalizada, detalles || ''],
            (err2) => {
                if (err2){
                    console.error('Error al registrar turno:', err2);
                    return res.status(500).json({mensaje: 'Error al solicitar el turno.'});
                }
                res.status(201).json({mensaje: 'Turno solicitado correctamente.'});
            }
        );
    });
};


exports.obtenerTurnosPaciente = (req, res) => {
    const {paciente_id} = req.params;

    const sql = `
    SELECT
        t.id,
        t.fecha,
        t.hora,
        t.estado,
        t.detalles,
        t.medico_id,
        t.especialidad_id,
        m.nombre AS nombre_medico,
        m.apellido AS apellido_medico,
        e.nombre AS especialidad
    FROM turnos t
    JOIN usuarios , ON t.medico_id = m.id
    JOIN especiañidades e ON t.especialidad_id = e.id
    WHERE t.paciente_id = ?
    ORDER BY t.fecha DESC, t.hora. ASC`;

    db.query(sql, [pacienteId], (err, resultados) =>{
        if (err){
            console.error('Error al obtener turnos:', err);
            return res.status(500).json({mensaje: 'Error al obtener los turnos.'});
        }
        res.status(200).json(resultados);
    });
};


exports.modificarTurno = (req,res) =>{
    const {id} = req.parans;
    const {nuevaFecha, nuevaHora} = req.body;

    if (!nuevaFecha || !nuevaHora){
        return res.status(400).json({mensaje: 'Debe indicar nueva fecha y hora.'});
    }
    const verificarEstado = `
    SELECT *
    FROM turnos
    WHERE id = ? AND estado = 'en espera' `;

    db.query(verificarEstado, [id], (err, resultados) => {
        if (err){
            console.error('Error al verificar estado del turno:', err);
            return res.status(500).json({mensaje: 'Error interno.'});
        }
        if (resultados.length===0){
            return res.status(400).json({mensaje: 'Solo se pueden modificar turnos en espera.'});
        }
        const turno = resultados[0];
        const verificarConflicto = `
        SELECT * FROM turnos
        WHERE medico_id =?
        AND fecha =?
        AND hora =?
        AND estado != 'cancelado'
        AND id !=?`;

        db.query(
            verificarConflicto,
            [turno.medico_id, nuevaFecha, nuevaHora, id],
            (err2, conflictos)=> {
                if (err2){
                    console.error('Error al verificar conflictos: ', err2);
                    return res.status(500).json({mensaje: 'Error al verificar disponibilidad.'});
                }
                if (conflictos.length > 0){
                    return res.status(409).json({mensaje: 'Esa fecha y hora ya están ocupadas. '});
                }
            const actualizar = `
            UPDATE turnos
            SET fecha =?, hora =?
            WHERE id =?`;
            db.query(actualizar, [nuevaFecha, nuevaHora, id], (err3) =>{
                if (err3) {
                    console.error('Error al actualizar turno: ', err3);
                    return res.status(500).json({mensaje: 'Error al actualizar el turno.'});
                }
                res.status(200).json({mensaje: 'Turno actualizado correctamente!'});
            });
            }
        );
    });
};

exports.cancelarTurno = (req, res) =>{
    const {id}= req.params;

    const buscarSql = `
    SELECT estado
    FROM turnos
    WHERE id=?`;

    db.query(buscarSql, [id], (err, resultados) => {
        if (err){
            console.error('Error al buscar turno:', err);
            return res.status(500).json({mensaje: 'Error al buscar el turno.'});
        }
        if (resultados.length===0){
            return res.status(404).json({mensaje: 'Turno no encontrado.'});
        }
        const estadoActual = resultados[0].estado;

        if (!['en espera'].includes(estadoActual)){
            return res.status(400).json({mensaje: 'Este turno ya no se puede cancelar.'});
        }
        
        const cancelarSql =`
        UPDATE turnos
        SET estado = "cancelado"
        WHERE id=?`;

        db.query(cancelarSql, [id], (err2) =>{
            if (err2){
                console.error('Error al cancelar el turno: ', err2);
                return res.status(500).json({mensaje: 'Error al cancelar el turno.'});
            }
            res.status(200).json({mensaje: 'Turno cancelado correctamente.'});
        });
    });
};


exports.actualizarDatosPaciente = async(req, res) => {
    const pacienteId = req.params.id;
    const {obra_social, nueva_contrasena} = req.body;
    const updates = [];
    const values = [];

    if (obra_social){
        updates.push('obra_social =?');
        values.push(obra_social);
    }

    if (nueva_contrasena){
        const hashed = await bycrypt.hash(nueva_contrasena, 10);
        updates.push('contrasena =?');
        values.push(hashed);
    }

    if (updates.lenght ===0){
        return res.status(400).json({mensaje: 'No hay datos para actualizar.'});
    }

    try{
        const sql =`
        UPDATE usuarios
        SET ${updates.join(',')}
        WHERE id=? AND tipo = 'paciente'`;
        values.push(pacienteId);

        await db.promise(),query(sql, values);
        res.status(200).json({mensaje: 'Datos actualizados correctamente.'});
    } catch (err){
        console.error('Error al actualizar paciente: ', err);
        res.status(500).json({mensaje: 'Error al actualizar datos.'});
    }
};



exports.cambiarContrasena = async (req, res)=>{
    const pacienteId = req.params.id;
    const {nueva_contrasena} = req.body;

    if (!nueva_contrasena){
        return res.status(400).json({mensaje: 'Debes ingresar una nueva contraseña.'});
    }

    try{
        const hashed = await bycrypt.hash(nueva_contrasena, 10);
        const sql= `
        UPDATE usuarios
        SET contrasena =?
        WHERE id =? AND tipo = 'paciente'`;

        db.query(sql, [hashed, pacienteId], (err)=>{
            if(err){
                console.error('Error al cambiar contraseña: ', err);
                return res.status(500) .json({mensaje: 'Error al cambiar la contraseña.'});
            }
            res.status(200) .json({mensaje: 'Contraseña actualizada correctamente.'});
        });
    } catch (err){
        console.error('Error al hashear contraseña: ', err);
        res.status(500).json({mensaje: 'Error interno del servidor.'});
    }
};