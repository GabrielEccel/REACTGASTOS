import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

axios.defaults.baseURL = 'https://localhost:7133';

function App() {
  const [gastos, setGastos] = useState([]);
  const [total, setTotal] = useState(0);
  const [formData, setFormData] = useState({
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    valor: ''
  });
  const [editando, setEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarGastos();
  }, []);

  const carregarGastos = async () => {
    setCarregando(true);
    setErro('');
    try {
      const [responseGastos, responseTotal] = await Promise.all([
        axios.get('/api/Gastos'),
        axios.get('/api/Gastos/total')
      ]);
      setGastos(responseGastos.data);
      setTotal(responseTotal.data);
    } catch (error) {
      handleApiError(error, 'Erro ao carregar gastos');
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    
    if (!formData.descricao || !formData.data || !formData.valor) {
      setErro('Preencha todos os campos');
      return;
    }
  
    const valor = parseFloat(formData.valor);
    if (isNaN(valor) || valor <= 0) {
      setErro('Valor inválido');
      return;
    }
  
    try {
      setCarregando(true);
      
      const gastoData = {
        descricao: formData.descricao,
        data: new Date(formData.data).toISOString(),
        valor: valor
      };
  
      if (editando) gastoData.id = editando;
  
      const response = editando
        ? await axios.put(`/api/Gastos/${editando}`, gastoData)
        : await axios.post('/api/Gastos', gastoData);
      
      resetForm();
      await carregarGastos();
    } catch (error) {
      handleApiError(error, 'Erro ao salvar gasto');
    } finally {
      setCarregando(false);
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      valor: ''
    });
    setEditando(null);
  };

  const editarGasto = (gasto) => {
    setEditando(gasto.id);
    setFormData({
      descricao: gasto.descricao,
      data: gasto.data.split('T')[0],
      valor: gasto.valor.toString()
    });
  };

  const excluirGasto = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este gasto?')) return;
    
    try {
      setCarregando(true);
      await axios.delete(`/api/Gastos/${id}`);
      await carregarGastos();
    } catch (error) {
      handleApiError(error, 'Erro ao excluir gasto');
    } finally {
      setCarregando(false);
    }
  };

  const handleApiError = (error, defaultMessage) => {
    console.error(error);
    if (error.response) {
      const apiError = error.response.data;
      setErro(apiError.title || apiError.message || defaultMessage);
    } else if (error.request) {
      setErro('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
    } else {
      setErro(defaultMessage);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor) => {
    return valor.toFixed(2).replace('.', ',');
  };

  return (
    <div className="container">
      <h1>Controle de Gastos</h1>
      
      {erro && <div className="erro">{erro}</div>}
      
      <form onSubmit={handleSubmit} className="formulario">
        <div className="form-group">
          <label>Descrição:</label>
          <input
            type="text"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            required
            disabled={carregando}
          />
        </div>
        
        <div className="form-group">
          <label>Data:</label>
          <input
            type="date"
            name="data"
            value={formData.data}
            onChange={handleChange}
            required
            disabled={carregando}
          />
        </div>
        
        <div className="form-group">
          <label>Valor (R$):</label>
          <input
            type="number"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
            disabled={carregando}
          />
        </div>
        
        <div className="botoes-form">
          <button 
            type="submit" 
            className="btn-salvar"
            disabled={carregando}
          >
            {carregando ? 'Processando...' : editando ? 'Atualizar' : 'Adicionar'}
          </button>
          
          {editando && (
            <button 
              type="button" 
              className="btn-cancelar"
              onClick={resetForm}
              disabled={carregando}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
      
      <div className="resumo">
        <h2>Total Gastos: R$ {formatarValor(total)}</h2>
      </div>
      
      {carregando && !gastos.length ? (
        <div className="carregando">Carregando...</div>
      ) : (
        <div className="tabela-container">
          <table className="tabela-gastos">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {gastos.length > 0 ? (
                gastos.map(gasto => (
                  <tr key={gasto.id}>
                    <td>{gasto.descricao}</td>
                    <td>{formatarData(gasto.data)}</td>
                    <td>R$ {formatarValor(gasto.valor)}</td>
                    <td className="acoes">
                      <button
                        onClick={() => editarGasto(gasto)}
                        className="btn-editar"
                        disabled={carregando}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluirGasto(gasto.id)}
                        className="btn-excluir"
                        disabled={carregando}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="sem-registros">
                    Nenhum gasto registrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;