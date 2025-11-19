import React, { useState, useEffect } from 'react';
import UserService from '../../services/user.service';

function ReporteClientes() {
    const [clientes, setClientes] = useState([]);

    useEffect(() => {
        UserService.getClientes()
            .then(res => setClientes(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h3>Cartera de Clientes Registrados ({clientes.length})</h3>
            <table style={{width:'100%', marginTop:'15px', borderCollapse:'collapse', backgroundColor:'white'}}>
                <thead style={{backgroundColor:'#3498db', color:'white'}}>
                    <tr>
                        <th style={{padding:'10px'}}>ID</th>
                        <th style={{padding:'10px'}}>Nombre Completo</th>
                        <th style={{padding:'10px'}}>DNI</th>
                        <th style={{padding:'10px'}}>Correo</th>
                        <th style={{padding:'10px'}}>Teléfono</th>
                        <th style={{padding:'10px'}}>Fecha Registro</th>
                    </tr>
                </thead>
                <tbody>
                    {clientes.map(c => (
                        <tr key={c.id} style={{borderBottom:'1px solid #ddd', textAlign:'center'}}>
                            <td style={{padding:'10px'}}>{c.id}</td>
                            <td style={{padding:'10px'}}>{c.nombre} {c.apellido}</td>
                            <td style={{padding:'10px'}}>{c.dni}</td>
                            <td style={{padding:'10px'}}>{c.correo}</td>
                            <td style={{padding:'10px'}}>{c.telefono}</td>
                            <td style={{padding:'10px'}}>{new Date(c.fechacreacion).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ReporteClientes;